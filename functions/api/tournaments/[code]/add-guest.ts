import {
  ApiContext,
  corsHeaders,
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
import { ulid } from "../../../lib/ulid";

/**
 * POST /api/tournaments/:code/add-guest — admin-only.
 * Opretter en gæste-spiller OG tilmelder den til turneringen, UDEN at
 * oprette en session (så adminens egen Discord-session ikke overskrives).
 * Genbruger en eksisterende gæste-spiller med samme gamertag, hvis den findes.
 */
export async function onRequestPost(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);
    const code = context.params.code as string;

    const body = (await ctx.request.json()) as { gamertag?: string };
    const gamertag = body.gamertag?.trim();
    if (!gamertag || gamertag.length < 2 || gamertag.length > 32) {
      throw new ResponseError("Gamertag skal være 2–32 tegn.", 400);
    }

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, game, status FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; name: string; game: string; status: string }>();
    if (!tournament) {
      throw new ResponseError("Turneringen findes ikke.", 404);
    }
    if (tournament.status !== "signup" && tournament.status !== "checkin") {
      throw new ResponseError("Turneringen accepterer ikke flere tilmeldinger.", 400);
    }

    // Find eller opret gæste-spilleren (kun spillere uden Discord-kobling)
    let player = await ctx.env.DB.prepare(
      "SELECT id, gamertag FROM players WHERE gamertag = ? COLLATE NOCASE AND discord_id IS NULL",
    )
      .bind(gamertag)
      .first<{ id: string; gamertag: string }>();
    if (!player) {
      player = { id: ulid(), gamertag };
      await ctx.env.DB.prepare(
        "INSERT INTO players (id, discord_id, gamertag, created_at) VALUES (?, NULL, ?, ?)",
      )
        .bind(player.id, gamertag, Date.now())
        .run();
    }

    const existing = await ctx.env.DB.prepare(
      "SELECT 1 FROM entries WHERE tournament_id = ? AND player_id = ?",
    )
      .bind(tournament.id, player.id)
      .first();
    if (existing) {
      throw new ResponseError(`${gamertag} er allerede tilmeldt denne turnering.`, 409);
    }

    await ctx.env.DB.prepare(
      "INSERT INTO entries (tournament_id, player_id, checked_in, seed) VALUES (?, ?, 0, NULL)",
    )
      .bind(tournament.id, player.id)
      .run();

    const count = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM entries WHERE tournament_id = ?",
    )
      .bind(tournament.id)
      .first<{ total: number }>();

    context.waitUntil(
      notifyDiscord(ctx.env, {
        title: `🎮 ${player.gamertag} er på bracket! (tilføjet af admin)`,
        description: `${gameLabel(tournament.game)} — ${tournament.name}`,
        color: DISCORD_COLORS.brick,
        url: tournamentUrl(ctx.request, code),
        fields: [
          { name: "Tilmeldte", value: `${count?.total ?? 0}`, inline: true },
        ],
      }),
    );

    return json(
      { success: true, player: { id: player.id, gamertag: player.gamertag } },
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
