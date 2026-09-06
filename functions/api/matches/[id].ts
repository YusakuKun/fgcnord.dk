import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
  requireSession,
  ResponseError,
} from "../../lib/api";
import { confirmMatchResult, loadMatch } from "../../lib/match";
import type { MatchRow } from "../../lib/match";
import {
  bracketUrl,
  DISCORD_COLORS,
  gameLabel,
  notifyDiscord,
} from "../../lib/discord";
import { applyRatingResult } from "../../lib/rating";

/** Opdater Elo-rating for en bekræftet turneringskamp (skakklub-modellen) */
async function applyTournamentRating(
  db: D1Database,
  match: MatchRow,
  winnerId: string,
): Promise<void> {
  const loserId =
    winnerId === match.player1_id ? match.player2_id : match.player1_id;
  if (!loserId) return;
  const t = await db
    .prepare("SELECT game FROM tournaments WHERE id = ?")
    .bind(match.tournament_id)
    .first<{ game: string }>();
  if (!t) return;
  await applyRatingResult(db, t.game, winnerId, loserId);
}

/** Post kampresultat til Discord når en kamp er bekræftet */
async function notifyMatchResult(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
  match: MatchRow,
  score1: number,
  score2: number,
  winnerId: string,
): Promise<void> {
  const ctx = context.data.ctx;
  const players = await ctx.env.DB.prepare(
    `SELECT p.id, p.gamertag, t.name AS tournament_name, t.game, t.join_code
     FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     LEFT JOIN players p ON p.id IN (m.player1_id, m.player2_id)
     WHERE m.id = ?`,
  )
    .bind(match.id)
    .all<{
      id: string | null;
      gamertag: string | null;
      tournament_name: string;
      game: string;
      join_code: string;
    }>();

  const rows = players.results || [];
  if (!rows.length) return;
  const name1 = rows.find((r) => r.id === match.player1_id)?.gamertag ?? "?";
  const name2 = rows.find((r) => r.id === match.player2_id)?.gamertag ?? "?";
  const winner = winnerId === match.player1_id ? name1 : name2;
  const { tournament_name, game, join_code } = rows[0];

  await notifyDiscord(ctx.env, {
    title: `⚔️ ${winner} vinder ${score1}-${score2}`,
    description: `${name1} vs ${name2} — ${gameLabel(game)} · ${tournament_name}`,
    color: DISCORD_COLORS.gold,
    url: bracketUrl(ctx.request, join_code),
    footer: { text: "Se den fulde bracket på fgcnord.dk" },
  });
}

export async function onRequestGet(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const match = await loadMatch(ctx.env.DB, (context.params.id as string));
    if (!match) {
      return error("Kampen findes ikke.", 404, corsHeaders(origin));
    }
    return json(match, { headers: corsHeaders(origin) });
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestPost(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  // Report result
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const matchId = (context.params.id as string);

    const body = (await ctx.request.json()) as {
      score1?: number;
      score2?: number;
    };
    const score1 = Number(body.score1);
    const score2 = Number(body.score2);

    if (
      !Number.isFinite(score1) ||
      !Number.isFinite(score2) ||
      score1 < 0 ||
      score2 < 0
    ) {
      throw new ResponseError("Ugyldig score.", 400);
    }

    const match = await loadMatch(ctx.env.DB, matchId);
    if (!match) {
      return error("Kampen findes ikke.", 404, corsHeaders(origin));
    }

    if (match.player1_id !== session.player_id && match.player2_id !== session.player_id) {
      throw new ResponseError("Du kan kun rapportere dine egne kampe.", 403);
    }

    if (match.status === "confirmed") {
      throw new ResponseError("Kampen er allerede bekræftet.", 400);
    }

    const winnerId =
      score1 > score2
        ? match.player1_id
        : score2 > score1
          ? match.player2_id
          : null;
    if (!winnerId) {
      throw new ResponseError("Kampen må ikke ende uafgjort.", 400);
    }

    if (match.status === "reported" || match.status === "disputed") {
      const sameReport =
        match.score1 === score1 &&
        match.score2 === score2 &&
        match.winner_id === winnerId;
      const isOpponent = match.reported_by !== session.player_id;

      if (sameReport && isOpponent) {
        await confirmMatchResult(
          ctx.env.DB,
          match,
          score1,
          score2,
          winnerId,
          match.reported_by ?? session.player_id,
        );
        context.waitUntil(
          (async () => {
            await applyTournamentRating(ctx.env.DB, match, winnerId);
            await notifyMatchResult(context, match, score1, score2, winnerId);
          })(),
        );
        return json({ success: true, status: "confirmed" }, { headers: corsHeaders(origin) });
      }

      await ctx.env.DB.prepare(
        "UPDATE matches SET status = 'disputed' WHERE id = ?",
      )
        .bind(matchId)
        .run();
      return json(
        {
          success: true,
          status: "disputed",
          message: "Resultatet er uenigt. Kald en referee.",
        },
        { headers: corsHeaders(origin) },
      );
    }

    await ctx.env.DB.prepare(
      `UPDATE matches SET score1 = ?, score2 = ?, winner_id = ?, status = 'reported',
        reported_by = ? WHERE id = ?`,
    )
      .bind(score1, score2, winnerId, session.player_id, matchId)
      .run();

    return json(
      {
        success: true,
        status: "reported",
        message: "Afventer modstanderens bekræftelse.",
      },
      { headers: corsHeaders(origin) },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestPut(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  // Confirm opponent's report
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const matchId = (context.params.id as string);

    const match = await loadMatch(ctx.env.DB, matchId);
    if (!match) {
      return error("Kampen findes ikke.", 404, corsHeaders(origin));
    }

    if (match.player1_id !== session.player_id && match.player2_id !== session.player_id) {
      throw new ResponseError("Du kan kun bekræfte dine egne kampe.", 403);
    }

    if (match.status !== "reported" && match.status !== "disputed") {
      throw new ResponseError("Kampen kan ikke bekræftes lige nu.", 400);
    }

    if (match.reported_by === session.player_id) {
      throw new ResponseError("Du kan ikke bekræfte dit eget resultat.", 400);
    }

    if (
      match.score1 === null ||
      match.score2 === null ||
      match.winner_id === null
    ) {
      throw new ResponseError("Manglende resultatdata.", 400);
    }

    await confirmMatchResult(
      ctx.env.DB,
      match,
      match.score1,
      match.score2,
      match.winner_id,
      match.reported_by ?? session.player_id,
    );

    // Fang narrowed værdier før closuren (TS bevarer ikke property-narrowing i closures)
    const finalScore1 = match.score1;
    const finalScore2 = match.score2;
    const finalWinnerId = match.winner_id;

    context.waitUntil(
      (async () => {
        await applyTournamentRating(ctx.env.DB, match, finalWinnerId);
        await notifyMatchResult(context, match, finalScore1, finalScore2, finalWinnerId);
      })(),
    );

    return json({ success: true, status: "confirmed" }, { headers: corsHeaders(origin) });
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestDelete(
  context: EventContext<Env, "id", { ctx: ApiContext }>,
): Promise<Response> {
  // Dispute opponent's report
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const matchId = (context.params.id as string);

    const match = await loadMatch(ctx.env.DB, matchId);
    if (!match) {
      return error("Kampen findes ikke.", 404, corsHeaders(origin));
    }

    if (match.player1_id !== session.player_id && match.player2_id !== session.player_id) {
      throw new ResponseError("Du kan kun dispute dine egne kampe.", 403);
    }

    if (match.status !== "reported") {
      throw new ResponseError("Kampen kan ikke disputes lige nu.", 400);
    }

    if (match.reported_by === session.player_id) {
      throw new ResponseError("Du kan ikke dispute dit eget resultat.", 400);
    }

    await ctx.env.DB.prepare("UPDATE matches SET status = 'disputed' WHERE id = ?")
      .bind(matchId)
      .run();

    return json(
      {
        success: true,
        status: "disputed",
        message: "Resultatet er under review. Kald en referee.",
      },
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
