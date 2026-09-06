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
import { DISCORD_COLORS, notifyDiscord } from "../../../lib/discord";
import { getLobby } from "../../../lib/lobby";

/** POST /api/lobby/[id]/join — meld dig til stede i lobbyen (kræver login) */
export async function onRequestPost(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const lobby = await getLobby(ctx.env.DB, (context.params.id as string));
    if (!lobby) {
      return error("Lobbyen findes ikke.", 404, corsHeaders(origin));
    }
    if (lobby.status !== "open") {
      throw new ResponseError("Lobbyen er lukket.", 400);
    }

    const existing = await ctx.env.DB.prepare(
      "SELECT 1 FROM lobby_attendees WHERE session_id = ? AND player_id = ?",
    )
      .bind(lobby.id, session.player_id)
      .first();
    if (existing) {
      throw new ResponseError("Du er allerede i lobbyen.", 409);
    }

    await ctx.env.DB.prepare(
      "INSERT INTO lobby_attendees (session_id, player_id, joined_at) VALUES (?, ?, ?)",
    )
      .bind(lobby.id, session.player_id, Date.now())
      .run();

    const count = await ctx.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM lobby_attendees WHERE session_id = ?",
    )
      .bind(lobby.id)
      .first<{ total: number }>();

    context.waitUntil(
      notifyDiscord(ctx.env, {
        title: `🙋 ${session.player.gamertag} er i lobbyen!`,
        description: `${lobby.title} — ${count?.total ?? 0} fremmødte`,
        color: DISCORD_COLORS.emerald,
        url: `${new URL(ctx.request.url).origin}/lobby`,
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
