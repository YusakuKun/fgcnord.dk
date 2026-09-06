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
import { getLobby, promoteQueue } from "../../../lib/lobby";
import { ulid } from "../../../lib/ulid";

/** POST /api/lobby/[id]/matches — udfordr en modstander fra lobbyen */
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

    const body = (await ctx.request.json()) as { opponent_id?: string };
    const opponentId = body.opponent_id;
    if (!opponentId) {
      throw new ResponseError("Vælg en modstander.", 400);
    }
    if (opponentId === session.player_id) {
      throw new ResponseError("Du kan ikke udfordre dig selv.", 400);
    }

    // Begge skal være meldt til stede
    const attendees = await ctx.env.DB.prepare(
      "SELECT player_id FROM lobby_attendees WHERE session_id = ? AND player_id IN (?, ?)",
    )
      .bind(lobby.id, session.player_id, opponentId)
      .all<{ player_id: string }>();
    if ((attendees.results || []).length !== 2) {
      throw new ResponseError("Begge spillere skal være meldt til stede i lobbyen.", 400);
    }

    // Undgå dobbelt-kampe: ingen aktiv kamp mellem samme par
    const active = await ctx.env.DB.prepare(
      `SELECT 1 FROM lobby_matches
       WHERE session_id = ? AND status IN ('queued', 'called', 'reported')
       AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))`,
    )
      .bind(lobby.id, session.player_id, opponentId, opponentId, session.player_id)
      .first();
    if (active) {
      throw new ResponseError("I har allerede en kamp i gang eller i kø.", 409);
    }

    const id = ulid();
    await ctx.env.DB.prepare(
      `INSERT INTO lobby_matches (id, session_id, station, player1_id, player2_id, status, created_at)
       VALUES (?, ?, NULL, ?, ?, 'queued', ?)`,
    )
      .bind(id, lobby.id, session.player_id, opponentId, Date.now())
      .run();

    // Er en station fri? Så kald kampen med det samme
    const called = await promoteQueue(ctx.env.DB, lobby);
    const mine = called.find((m) => m.id === id);

    if (mine) {
      context.waitUntil(
        notifyDiscord(ctx.env, {
          title: `🎙️ Setup ${mine.station}: ${mine.p1_tag} vs ${mine.p2_tag}`,
          description: `${lobby.title} — det er jeres tur! Rapportér resultatet på siden bagefter.`,
          color: DISCORD_COLORS.gold,
          url: `${new URL(ctx.request.url).origin}/lobby`,
        }),
      );
    }

    return json(
      { success: true, match_id: id, status: mine ? "called" : "queued", station: mine?.station ?? null },
      { headers: corsHeaders(origin) },
    );
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
