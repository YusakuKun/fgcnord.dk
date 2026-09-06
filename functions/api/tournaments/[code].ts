import {
  ApiContext,
  corsHeaders,
  error,
  getOrigin,
  handleError,
  json,
} from "../../lib/api";

export interface TournamentPublic {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  join_code: string;
  startgg_slug: string | null;
  start_at: number | null;
  created_at: number;
  entrants: { id: string; gamertag: string; checked_in: number; seed: number | null }[];
  my_entry?: { checked_in: number; seed: number | null } | null;
}

export async function onRequestGet(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const code = ctx.params.code;
    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, game, format, status, join_code, startgg_slug, start_at, created_at FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<TournamentPublic>();

    if (!tournament) {
      return error("Turneringen findes ikke.", 404, corsHeaders(origin));
    }

    const entrants = await ctx.env.DB.prepare(
      `SELECT p.id, p.gamertag, e.checked_in, e.seed
       FROM entries e
       JOIN players p ON p.id = e.player_id
       WHERE e.tournament_id = ?
       ORDER BY e.seed ASC, p.gamertag ASC`,
    )
      .bind(tournament.id)
      .all<{ id: string; gamertag: string; checked_in: number; seed: number | null }>();

    tournament.entrants = entrants.results || [];

    if (ctx.data.player) {
      const myEntry = await ctx.env.DB.prepare(
        "SELECT checked_in, seed FROM entries WHERE tournament_id = ? AND player_id = ?",
      )
        .bind(tournament.id, ctx.data.player.id)
        .first<{ checked_in: number; seed: number | null }>();
      tournament.my_entry = myEntry || null;
    }

    return json(tournament, { headers: corsHeaders(origin) });
  } catch (err) {
    // MIDLERTIDIG DIAGNOSE — rulles tilbage så snart fejlen er fundet.
    return json(
      { diag: String(err), stack: err instanceof Error ? err.stack : undefined },
      { status: 500, headers: corsHeaders(origin) },
    );
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
