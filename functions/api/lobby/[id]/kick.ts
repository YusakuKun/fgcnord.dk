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
import { DISCORD_COLORS, notifyDiscord } from "../../../lib/discord";
import { getLobby } from "../../../lib/lobby";

interface KickBody {
  player_id?: string;
}

/** POST /api/lobby/[id]/kick — admin fjerner en spiller fra lobbyen */
export async function onRequestPost(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);
    const lobby = await getLobby(ctx.env.DB, context.params.id as string);
    if (!lobby) {
      return error("Lobbyen findes ikke.", 404, corsHeaders(origin));
    }

    const body = (await ctx.request.json().catch(() => ({}))) as KickBody;
    const playerId = typeof body.player_id === "string" ? body.player_id.trim() : "";
    if (!playerId) {
      throw new ResponseError("Manglende player_id.", 400);
    }

    const attendee = await ctx.env.DB.prepare(
      `SELECT p.gamertag FROM lobby_attendees la
       JOIN players p ON p.id = la.player_id
       WHERE la.session_id = ? AND la.player_id = ?`,
    )
      .bind(lobby.id, playerId)
      .first<{ gamertag: string }>();
    if (!attendee) {
      throw new ResponseError("Spilleren er ikke i lobbyen.", 404);
    }

    // Aflys spillerens kampe der ikke er startet endnu (kø), og fjern fra listen
    await ctx.env.DB.batch([
      ctx.env.DB.prepare(
        "UPDATE lobby_matches SET status = 'cancelled' WHERE session_id = ? AND status = 'queued' AND (player1_id = ? OR player2_id = ?)",
      ).bind(lobby.id, playerId, playerId),
      ctx.env.DB.prepare(
        "DELETE FROM lobby_attendees WHERE session_id = ? AND player_id = ?",
      ).bind(lobby.id, playerId),
    ]);

    const count = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM lobby_attendees WHERE session_id = ?",
    )
      .bind(lobby.id)
      .first<{ total: number }>();

    context.waitUntil(
      notifyDiscord(ctx.env, {
        title: `👢 ${attendee.gamertag} blev fjernet fra lobbyen`,
        description: `${lobby.title} — ${count?.total ?? 0} fremmødte tilbage`,
        color: DISCORD_COLORS.brick,
        url: `${new URL(ctx.request.url).origin}/lobby`,
      }),
    );

    return json({ success: true, kicked: attendee.gamertag }, { headers: corsHeaders(origin) });
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
