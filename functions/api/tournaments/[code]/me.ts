import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
  requireSession,
} from "../../../lib/api";
import { getPlayerCurrentMatch, loadMatches } from "../../../lib/match";

export async function onRequestGet(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const session = await requireSession(ctx);
    const code = (context.params.code as string);

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, status FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; status: string }>();

    if (!tournament) {
      return error("Turneringen findes ikke.", 404, corsHeaders(origin));
    }

    const entry = await ctx.env.DB.prepare(
      "SELECT checked_in, seed FROM entries WHERE tournament_id = ? AND player_id = ?",
    )
      .bind(tournament.id, session.player_id)
      .first<{ checked_in: number; seed: number | null }>();

    if (!entry) {
      return json(
        { joined: false, checked_in: false, match: null },
        { headers: corsHeaders(origin) },
      );
    }

    const currentMatch =
      tournament.status === "live"
        ? await getPlayerCurrentMatch(ctx.env.DB, tournament.id, session.player_id)
        : null;

    const allMatches =
      tournament.status === "live"
        ? await loadMatches(ctx.env.DB, tournament.id)
        : [];

    return json(
      {
        joined: true,
        player_id: session.player_id,
        checked_in: entry.checked_in === 1,
        seed: entry.seed,
        match: currentMatch,
        matches: allMatches,
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
