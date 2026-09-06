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
  gameLabel,
  notifyDiscord,
  tournamentUrl,
} from "../../../lib/discord";
import { normalizeEventSlug, startggQuery } from "../../../lib/startgg";
import { ulid } from "../../../lib/ulid";

interface EntrantsData {
  event: {
    id: string;
    name: string;
    entrants: {
      pageInfo: { total: number; totalPages: number };
      nodes: {
        id: string;
        name: string;
        participants: { id: string; gamerTag: string; prefix: string | null }[];
        seeds: { seedNum: number }[];
      }[];
    } | null;
  } | null;
}

const ENTRANTS_QUERY = `query EventEntrants($slug: String, $page: Int!, $perPage: Int!) {
  event(slug: $slug) {
    id
    name
    entrants(query: { page: $page, perPage: $perPage }) {
      pageInfo { total totalPages }
      nodes {
        id
        name
        participants { id gamerTag prefix }
        seeds { seedNum }
      }
    }
  }
}`;

/**
 * POST /api/tournaments/[code]/import-entrants — admin:
 * Hent tilmeldte fra det tilknyttede start.gg-event og opret dem som entries.
 * Spillere matches på gamertag (case-insensitiv); ukendte oprettes som gæster.
 */
export async function onRequestPost(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);
    const code = (context.params.code as string);

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, game, status, startgg_slug FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; name: string; game: string; status: string; startgg_slug: string | null }>();

    if (!tournament) {
      return error("Turneringen findes ikke.", 404, corsHeaders(origin));
    }
    if (!tournament.startgg_slug) {
      throw new ResponseError(
        "Turneringen har ingen start.gg-slug. Opret den med slug først.",
        400,
      );
    }
    if (tournament.status !== "signup" && tournament.status !== "checkin") {
      throw new ResponseError("Importér kun mens turneringen er åben for tilmelding.", 400);
    }

    const slug = normalizeEventSlug(tournament.startgg_slug);
    if (!slug.includes("/event/")) {
      throw new ResponseError(
        `Slug "${slug}" peger ikke på et event. Format: tournament/<navn>/event/<event>.`,
        400,
      );
    }

    // Hent alle sider af tilmeldte (max 10 sider à 50 = 500)
    const first = await startggQuery<EntrantsData>(ctx.env, ENTRANTS_QUERY, {
      slug,
      page: 1,
      perPage: 50,
    });
    if (!first.event) {
      throw new ResponseError(`Fandt intet start.gg-event med slug "${slug}".`, 404);
    }

    const nodes = [...(first.event.entrants?.nodes || [])];
    const totalPages = Math.min(first.event.entrants?.pageInfo.totalPages ?? 1, 10);
    for (let page = 2; page <= totalPages; page++) {
      const next = await startggQuery<EntrantsData>(ctx.env, ENTRANTS_QUERY, {
        slug,
        page,
        perPage: 50,
      });
      nodes.push(...(next.event?.entrants?.nodes || []));
    }

    const now = Date.now();
    let imported = 0;
    let alreadyRegistered = 0;

    for (const entrant of nodes) {
      const participant = entrant.participants[0];
      const tag = (participant?.gamerTag || entrant.name || "").trim();
      if (!tag) continue;
      const seed = entrant.seeds?.[0]?.seedNum ?? null;

      // Find eksisterende spiller på gamertag, ellers opret som gæst
      let player = await ctx.env.DB.prepare(
        "SELECT id FROM players WHERE LOWER(gamertag) = LOWER(?)",
      )
        .bind(tag)
        .first<{ id: string }>();

      if (!player) {
        const playerId = ulid();
        await ctx.env.DB.prepare(
          "INSERT INTO players (id, discord_id, gamertag, created_at) VALUES (?, NULL, ?, ?)",
        )
          .bind(playerId, tag, now)
          .run();
        player = { id: playerId };
      }

      const result = await ctx.env.DB.prepare(
        "INSERT OR IGNORE INTO entries (tournament_id, player_id, checked_in, seed) VALUES (?, ?, 0, ?)",
      )
        .bind(tournament.id, player.id, seed)
        .run();

      if (result.meta.changes > 0) {
        imported++;
      } else {
        alreadyRegistered++;
      }
    }

    context.waitUntil(
      notifyDiscord(ctx.env, {
        title: `📥 ${imported} tilmeldte hentet fra start.gg`,
        description: `${gameLabel(tournament.game)} — ${tournament.name}`,
        color: DISCORD_COLORS.brick,
        url: tournamentUrl(ctx.request, code),
        fields: [
          { name: "Nye", value: `${imported}`, inline: true },
          { name: "Allerede tilmeldt", value: `${alreadyRegistered}`, inline: true },
        ],
      }),
    );

    return json(
      {
        success: true,
        imported,
        alreadyRegistered,
        total: nodes.length,
        event: first.event.name,
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
