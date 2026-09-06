import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
} from "../../../lib/api";
import { loadMatches } from "../../../lib/match";

export async function onRequestGet(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const code = (context.params.code as string);
    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, status FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; name: string; status: string }>();

    if (!tournament) {
      return error("Turneringen findes ikke.", 404, corsHeaders(origin));
    }

    const matches = await loadMatches(ctx.env.DB, tournament.id);
    const entrants = await ctx.env.DB.prepare(
      `SELECT p.id, p.gamertag
       FROM entries e
       JOIN players p ON p.id = e.player_id
       WHERE e.tournament_id = ?`,
    )
      .bind(tournament.id)
      .all<{ id: string; gamertag: string }>();

    return json(
      {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status,
        },
        entrants: entrants.results || [],
        matches,
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
