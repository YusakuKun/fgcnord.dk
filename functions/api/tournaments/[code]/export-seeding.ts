import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
  requireAdmin,
  ResponseError,
} from "../../../lib/api";
import {
  DISCORD_COLORS,
  notifyDiscord,
  tournamentUrl,
} from "../../../lib/discord";
import { normalizeEventSlug, startggQuery } from "../../../lib/startgg";

/**
 * POST /api/tournaments/[code]/export-seeding — admin:
 * Push seeding til det tilknyttede start.gg-event baseret på vores Elo-rating.
 *
 * start.gg's API kan IKKE tilføje deltagere — men det KAN opdatere seeding
 * (updatePhaseSeeding). Flowet er derfor:
 *   1. Hent eventets phases + nuværende seeds fra start.gg
 *   2. Match vores tilmeldte (checked-in først, ellers alle) på gamertag
 *   3. Sorter efter Elo-rating i turneringens spil
 *   4. Skriv den nye seed-orden tilbage til start.gg
 *
 * Kræver at STARTGG_API_TOKEN tilhører en admin af start.gg-turneringen.
 */

interface PhaseData {
  event: {
    id: string;
    name: string;
    phases: {
      id: string;
      name: string;
      seeds: {
        pageInfo: { total: number; totalPages: number };
        nodes: {
          id: string;
          seedNum: number;
          entrant: {
            id: string;
            participants: { gamerTag: string }[];
          } | null;
        }[];
      };
    }[];
  } | null;
}

const PHASE_SEEDS_QUERY = `query PhaseSeeds($slug: String, $page: Int!, $perPage: Int!) {
  event(slug: $slug) {
    id
    name
    phases {
      id
      name
      seeds(query: { page: $page, perPage: $perPage }) {
        pageInfo { total totalPages }
        nodes {
          id
          seedNum
          entrant { id participants { gamerTag } }
        }
      }
    }
  }
}`;

const UPDATE_SEEDING_MUTATION = `mutation UpdatePhaseSeeding($phaseId: ID!, $seedMapping: [UpdatePhaseSeedInfo]!) {
  updatePhaseSeeding(phaseId: $phaseId, seedMapping: $seedMapping) { id }
}`;

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export async function onRequestPost(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);
    const code = context.params.code as string;

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, game, status, startgg_slug FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{
        id: string;
        name: string;
        game: string;
        status: string;
        startgg_slug: string | null;
      }>();

    if (!tournament) {
      return error("Turneringen findes ikke.", 404, corsHeaders(origin));
    }
    if (!tournament.startgg_slug) {
      throw new ResponseError(
        "Turneringen har ingen start.gg-slug. Opret den med slug først.",
        400,
      );
    }
    const slug = normalizeEventSlug(tournament.startgg_slug);

    // Vores tilmeldte: checked-in spillere hvis nogen er checket ind, ellers alle
    const entries = await ctx.env.DB.prepare(
      `SELECT p.id, p.gamertag, e.checked_in,
              COALESCE(r.rating, 1000) as rating,
              COALESCE(r.matches_played, 0) as matches_played
       FROM entries e
       JOIN players p ON p.id = e.player_id
       LEFT JOIN ratings r ON r.player_id = p.id AND r.game = ?
       WHERE e.tournament_id = ?`,
    )
    .bind(tournament.game, tournament.id)
    .all<{
      id: string;
      gamertag: string;
      checked_in: number;
      rating: number;
      matches_played: number;
    }>();

    let pool = entries.results || [];
    const anyCheckedIn = pool.some((e) => e.checked_in === 1);
    if (anyCheckedIn) pool = pool.filter((e) => e.checked_in === 1);
    if (pool.length === 0) {
      throw new ResponseError("Der er ingen tilmeldte at seede.", 400);
    }

    // Ratede spillere først (rating desc), derefter uratede alfabetisk
    pool.sort((a, b) => {
      const aRated = a.matches_played > 0 ? 1 : 0;
      const bRated = b.matches_played > 0 ? 1 : 0;
      if (aRated !== bRated) return bRated - aRated;
      if (aRated) return b.rating - a.rating;
      return a.gamertag.localeCompare(b.gamertag, "da");
    });

    // Hent phases + seeds fra start.gg (pagineret)
    const perPage = 100;
    const firstPage = await startggQuery<PhaseData>(ctx.env, PHASE_SEEDS_QUERY, {
      slug,
      page: 1,
      perPage,
    });
    if (!firstPage.event) {
      throw new ResponseError(
        `Fandt ikke noget start.gg-event med slug "${slug}".`,
        404,
      );
    }
    const phase = firstPage.event.phases[0];
    if (!phase) {
      throw new ResponseError("Eventet har ingen phases på start.gg.", 400);
    }
    let seeds = phase.seeds.nodes;
    const totalPages = phase.seeds.pageInfo.totalPages;
    for (let page = 2; page <= totalPages; page++) {
      const more = await startggQuery<PhaseData>(ctx.env, PHASE_SEEDS_QUERY, {
        slug,
        page,
        perPage,
      });
      seeds = seeds.concat(more.event?.phases[0]?.seeds.nodes ?? []);
    }

    // Match vores spillere på gamertag (uden prefix)
    const seedByTag = new Map<string, { id: string; seedNum: number }>();
    for (const seed of seeds) {
      const tag = seed.entrant?.participants[0]?.gamerTag;
      if (tag) seedByTag.set(normalizeTag(tag), { id: seed.id, seedNum: seed.seedNum });
    }

    const seedMapping: { seedId: string; seedNum: number }[] = [];
    const matched = new Set<string>();
    const unmatchedSite: string[] = [];
    let nextSeed = 1;
    for (const p of pool) {
      const seed = seedByTag.get(normalizeTag(p.gamertag));
      if (!seed) {
        unmatchedSite.push(p.gamertag);
        continue;
      }
      seedMapping.push({ seedId: seed.id, seedNum: nextSeed++ });
      matched.add(seed.id);
    }
    // start.gg-deltagere vi ikke kender ryger ned under vores, i samme interne orden
    for (const seed of seeds) {
      if (matched.has(seed.id)) continue;
      seedMapping.push({ seedId: seed.id, seedNum: nextSeed++ });
    }

    if (matched.size === 0) {
      throw new ResponseError(
        "Ingen af vores tilmeldte matcher deltagerne på start.gg-eventet (gamertags skal være ens).",
        400,
      );
    }

    await startggQuery(ctx.env, UPDATE_SEEDING_MUTATION, {
      phaseId: phase.id,
      seedMapping,
    });

    await notifyDiscord(ctx.env, {
      title: "📤 Seeding sendt til start.gg",
      description: `**${tournament.name}**: ${matched.size} spillere seedet efter rangliste-rating.`,
      color: DISCORD_COLORS.emerald,
      url: tournamentUrl(ctx.request, code),
      footer: { text: `${firstPage.event.name} · ${phase.name}` },
    });

    return json(
      {
        success: true,
        event: firstPage.event.name,
        phase: phase.name,
        seeded: matched.size,
        unmatchedSite,
      },
      { headers: corsHeaders(origin) },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestOptions(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(getOrigin(context.data.ctx.request)),
  });
}
