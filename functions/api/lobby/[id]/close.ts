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
import { DISCORD_COLORS, gameLabel, notifyDiscord } from "../../../lib/discord";
import { getLobby } from "../../../lib/lobby";

/** POST /api/lobby/[id]/close — admin: luk lobbyen og post aftenens rangliste */
export async function onRequestPost(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);
    const lobby = await getLobby(ctx.env.DB, (context.params.id as string));
    if (!lobby) {
      return error("Lobbyen findes ikke.", 404, corsHeaders(origin));
    }
    if (lobby.status !== "open") {
      throw new ResponseError("Lobbyen er allerede lukket.", 400);
    }

    // Aflys kampe der aldrig blev færdige
    await ctx.env.DB.prepare(
      "UPDATE lobby_matches SET status = 'cancelled' WHERE session_id = ? AND status IN ('queued', 'called', 'reported')",
    )
      .bind(lobby.id)
      .run();

    await ctx.env.DB.prepare(
      "UPDATE lobby_sessions SET status = 'closed', closed_at = ? WHERE id = ?",
    )
      .bind(Date.now(), lobby.id)
      .run();

    // Aftenens statistik + aktuel top 5 i spillet
    const played = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM lobby_matches WHERE session_id = ? AND status = 'done'",
    )
      .bind(lobby.id)
      .first<{ total: number }>();
    const attendance = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM lobby_attendees WHERE session_id = ?",
    )
      .bind(lobby.id)
      .first<{ total: number }>();

    const top = await ctx.env.DB.prepare(
      `SELECT p.gamertag, r.rating, r.wins, r.losses
       FROM ratings r JOIN players p ON p.id = r.player_id
       WHERE r.game = ?
       ORDER BY r.rating DESC
       LIMIT 5`,
    )
      .bind(lobby.game)
      .all<{ gamertag: string; rating: number; wins: number; losses: number }>();

    const medals = ["🥇", "🥈", "🥉", "4.", "5."];
    const leaderboard = (top.results || [])
      .map((r, i) => `${medals[i]} **${r.gamertag}** — ${r.rating} (${r.wins}W/${r.losses}L)`)
      .join("\n");

    context.waitUntil(
      notifyDiscord(ctx.env, {
        title: `🏁 Lobby lukket: ${lobby.title}`,
        description: `${gameLabel(lobby.game)} — ${attendance?.total ?? 0} fremmødte, ${played?.total ?? 0} ratede kampe spillet.`,
        color: DISCORD_COLORS.coal,
        url: `${new URL(ctx.request.url).origin}/rangliste`,
        fields: leaderboard
          ? [{ name: `Rangliste — ${gameLabel(lobby.game)}`, value: leaderboard }]
          : undefined,
        footer: { text: "Se hele ranglisten på fgcnord.dk/rangliste" },
      }),
    );

    return json({ success: true }, { headers: corsHeaders(origin) });
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestOptions(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(getOrigin(context.data.ctx.request)),
  });
}
