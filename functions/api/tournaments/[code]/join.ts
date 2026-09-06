import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
  requireSession,
  ResponseError,
} from "../../../lib/api";
import {
  DISCORD_COLORS,
  gameLabel,
  notifyDiscord,
  tournamentUrl,
} from "../../../lib/discord";

export async function onRequestPost(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const code = (context.params.code as string);

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, game, status FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; name: string; game: string; status: string }>();

    if (!tournament) {
      return error("Turneringen findes ikke.", 404, corsHeaders(origin));
    }

    if (tournament.status !== "signup" && tournament.status !== "checkin") {
      throw new ResponseError("Turneringen accepterer ikke flere tilmeldinger.", 400);
    }

    const existing = await ctx.env.DB.prepare(
      "SELECT 1 FROM entries WHERE tournament_id = ? AND player_id = ?",
    )
      .bind(tournament.id, session.player_id)
      .first();
    if (existing) {
      throw new ResponseError("Du er allerede tilmeldt denne turnering.", 409);
    }

    await ctx.env.DB.prepare(
      "INSERT INTO entries (tournament_id, player_id, checked_in, seed) VALUES (?, ?, 0, NULL)",
    )
      .bind(tournament.id, session.player_id)
      .run();

    const count = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM entries WHERE tournament_id = ?",
    )
      .bind(tournament.id)
      .first<{ total: number }>();

    // Fortæl Discord om den nye tilmelding
    context.waitUntil(
      notifyDiscord(ctx.env, {
        title: `🎮 ${session.player.gamertag} er på bracket!`,
        description: `${gameLabel(tournament.game)} — ${tournament.name}`,
        color: DISCORD_COLORS.brick,
        url: tournamentUrl(ctx.request, code),
        fields: [
          { name: "Tilmeldte", value: `${count?.total ?? 0}`, inline: true },
        ],
        footer: { text: "Scan QR-koden på siden for at join" },
      }),
    );

    return json(
      { success: true, tournament_id: tournament.id },
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
