import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
  requireAdmin,
  requireSession,
  ResponseError,
} from "../../../lib/api";
import { DISCORD_COLORS, gameLabel, notifyDiscord } from "../../../lib/discord";
import { getLobby, promoteQueue, type LobbyMatchRow } from "../../../lib/lobby";
import { applyRatingResult } from "../../../lib/rating";

async function loadLobbyMatch(db: D1Database, id: string): Promise<LobbyMatchRow | null> {
  return db
    .prepare(
      `SELECT m.*, p1.gamertag AS p1_tag, p2.gamertag AS p2_tag,
              p1.discord_id AS p1_discord, p2.discord_id AS p2_discord
       FROM lobby_matches m
       JOIN players p1 ON p1.id = m.player1_id
       JOIN players p2 ON p2.id = m.player2_id
       WHERE m.id = ?`,
    )
    .bind(id)
    .first<LobbyMatchRow>();
}

/** POST — rapportér resultat (deltager) */
export async function onRequestPost(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const match = await loadLobbyMatch(ctx.env.DB, (context.params.id as string));
    if (!match) {
      return error("Kampen findes ikke.", 404, corsHeaders(origin));
    }
    if (match.player1_id !== session.player_id && match.player2_id !== session.player_id) {
      throw new ResponseError("Du kan kun rapportere dine egne kampe.", 403);
    }
    if (match.status !== "called" && match.status !== "reported") {
      throw new ResponseError("Kampen kan ikke rapporteres lige nu.", 400);
    }

    const body = (await ctx.request.json()) as { score1?: number; score2?: number };
    const score1 = Number(body.score1);
    const score2 = Number(body.score2);
    if (!Number.isFinite(score1) || !Number.isFinite(score2) || score1 < 0 || score2 < 0) {
      throw new ResponseError("Ugyldig score.", 400);
    }
    if (score1 === score2) {
      throw new ResponseError("Kampen må ikke ende uafgjort.", 400);
    }

    const winnerId = score1 > score2 ? match.player1_id : match.player2_id;

    await ctx.env.DB.prepare(
      "UPDATE lobby_matches SET score1 = ?, score2 = ?, winner_id = ?, status = 'reported', reported_by = ? WHERE id = ?",
    )
      .bind(score1, score2, winnerId, session.player_id, match.id)
      .run();

    return json(
      { success: true, status: "reported", message: "Afventer modstanderens bekræftelse." },
      { headers: corsHeaders(origin) },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}

/** PUT — bekræft modstanderens resultat → rating + næste i køen kaldes */
export async function onRequestPut(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const match = await loadLobbyMatch(ctx.env.DB, (context.params.id as string));
    if (!match) {
      return error("Kampen findes ikke.", 404, corsHeaders(origin));
    }
    if (match.player1_id !== session.player_id && match.player2_id !== session.player_id) {
      throw new ResponseError("Du kan kun bekræfte dine egne kampe.", 403);
    }
    if (match.status !== "reported") {
      throw new ResponseError("Kampen kan ikke bekræftes lige nu.", 400);
    }
    if (match.reported_by === session.player_id) {
      throw new ResponseError("Du kan ikke bekræfte dit eget resultat.", 400);
    }
    if (match.score1 === null || match.score2 === null || !match.winner_id) {
      throw new ResponseError("Manglende resultatdata.", 400);
    }

    await ctx.env.DB.prepare(
      "UPDATE lobby_matches SET status = 'done', finished_at = ? WHERE id = ?",
    )
      .bind(Date.now(), match.id)
      .run();

    const lobby = await getLobby(ctx.env.DB, match.session_id);
    if (!lobby) {
      throw new ResponseError("Lobbyen findes ikke.", 500);
    }

    // Rating-opdatering (skakklub-modellen)
    const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id;
    const rating = await applyRatingResult(ctx.env.DB, lobby.game, match.winner_id, loserId);

    const winnerTag = match.winner_id === match.player1_id ? match.p1_tag : match.p2_tag;
    const loserTag = match.winner_id === match.player1_id ? match.p2_tag : match.p1_tag;

    // Station fri → kald næste i køen
    const called = await promoteQueue(ctx.env.DB, lobby);

    context.waitUntil(
      (async () => {
        await notifyDiscord(ctx.env, {
          title: `⚔️ ${winnerTag} vinder ${match.score1}-${match.score2}`,
          description: `${match.p1_tag} vs ${match.p2_tag} — ${gameLabel(lobby.game)} casuals · ${lobby.title}`,
          color: DISCORD_COLORS.gold,
          url: `${new URL(ctx.request.url).origin}/lobby`,
          fields: [
            {
              name: "Rating",
              value: `${winnerTag}: ${rating.winnerRating} (+${rating.winnerDelta}) · ${loserTag}: ${rating.loserRating} (${rating.loserDelta})`,
            },
          ],
        });
        for (const m of called) {
          await notifyDiscord(ctx.env, {
            title: `🎙️ Setup ${m.station}: ${m.p1_tag} vs ${m.p2_tag}`,
            description: `${lobby.title} — det er jeres tur!`,
            color: DISCORD_COLORS.gold,
            url: `${new URL(ctx.request.url).origin}/lobby`,
          });
        }
      })(),
    );

    return json(
      {
        success: true,
        status: "done",
        rating: { winner: rating.winnerRating, winnerDelta: rating.winnerDelta, loser: rating.loserRating, loserDelta: rating.loserDelta },
      },
      { headers: corsHeaders(origin) },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}

/** DELETE — aflys kamp (deltager eller admin) */
export async function onRequestDelete(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const match = await loadLobbyMatch(ctx.env.DB, (context.params.id as string));
    if (!match) {
      return error("Kampen findes ikke.", 404, corsHeaders(origin));
    }

    // Enten deltager eller admin-nøgle
    let authorized = false;
    try {
      requireAdmin(ctx);
      authorized = true;
    } catch {
      const session = await requireSession(ctx);
      authorized = match.player1_id === session.player_id || match.player2_id === session.player_id;
    }
    if (!authorized) {
      throw new ResponseError("Du kan kun aflyse dine egne kampe.", 403);
    }
    if (match.status === "done") {
      throw new ResponseError("En afsluttet kamp kan ikke aflyses.", 400);
    }

    await ctx.env.DB.prepare("UPDATE lobby_matches SET status = 'cancelled' WHERE id = ?")
      .bind(match.id)
      .run();

    // Frigør stationen → kald næste
    const lobby = await getLobby(ctx.env.DB, match.session_id);
    if (lobby && match.station !== null) {
      const called = await promoteQueue(ctx.env.DB, lobby);
      for (const m of called) {
        context.waitUntil(
          notifyDiscord(ctx.env, {
            title: `🎙️ Setup ${m.station}: ${m.p1_tag} vs ${m.p2_tag}`,
            description: `${lobby.title} — det er jeres tur!`,
            color: DISCORD_COLORS.gold,
            url: `${new URL(ctx.request.url).origin}/lobby`,
          }),
        );
      }
    }

    return json({ success: true, status: "cancelled" }, { headers: corsHeaders(origin) });
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
