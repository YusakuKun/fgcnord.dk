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
import { getLobby } from "../../../lib/lobby";

/** POST /api/lobby/[id]/leave — meld dig FRA lobbyen (kræver login) */
export async function onRequestPost(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const lobby = await getLobby(ctx.env.DB, context.params.id as string);
    if (!lobby) {
      return error("Lobbyen findes ikke.", 404, corsHeaders(origin));
    }

    const existing = await ctx.env.DB.prepare(
      "SELECT 1 FROM lobby_attendees WHERE session_id = ? AND player_id = ?",
    )
      .bind(lobby.id, session.player_id)
      .first();
    if (!existing) {
      throw new ResponseError("Du er ikke i lobbyen.", 409);
    }

    // Aflys egne kampe der ikke er startet endnu (kø), så de ikke hænger
    await ctx.env.DB.batch([
      ctx.env.DB.prepare(
        "UPDATE lobby_matches SET status = 'cancelled' WHERE session_id = ? AND status = 'queued' AND (player1_id = ? OR player2_id = ?)",
      ).bind(lobby.id, session.player_id, session.player_id),
      ctx.env.DB.prepare(
        "DELETE FROM lobby_attendees WHERE session_id = ? AND player_id = ?",
      ).bind(lobby.id, session.player_id),
    ]);

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
