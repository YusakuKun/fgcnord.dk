import {
  ApiContext,
  corsHeaders,
  getOrigin,
  handleError,
  json,
  requireAdmin,
  ResponseError,
} from "../../../lib/api";

/**
 * DELETE /api/tournaments/:code/remove-entrant — admin-only.
 * Fjerner en spiller fra en turnering. Kun muligt mens turneringen
 * stadig er i signup/check-in (ellers ville bracket-kampe hænge).
 */
export async function onRequestDelete(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);
    const code = context.params.code as string;

    const body = (await ctx.request.json()) as { player_id?: string };
    const playerId = body.player_id?.trim();
    if (!playerId) {
      throw new ResponseError("Mangler player_id.", 400);
    }

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name, status FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; name: string; status: string }>();
    if (!tournament) {
      throw new ResponseError("Turneringen findes ikke.", 404);
    }
    if (tournament.status !== "signup" && tournament.status !== "checkin") {
      throw new ResponseError(
        "Kan kun fjerne spillere før bracket er startet.",
        400,
      );
    }

    const entry = await ctx.env.DB.prepare(
      `SELECT p.gamertag FROM entries e JOIN players p ON p.id = e.player_id
       WHERE e.tournament_id = ? AND e.player_id = ?`,
    )
      .bind(tournament.id, playerId)
      .first<{ gamertag: string }>();
    if (!entry) {
      throw new ResponseError("Spilleren er ikke tilmeldt denne turnering.", 404);
    }

    await ctx.env.DB.prepare(
      "DELETE FROM entries WHERE tournament_id = ? AND player_id = ?",
    )
      .bind(tournament.id, playerId)
      .run();

    return json(
      { success: true, removed: { player_id: playerId, gamertag: entry.gamertag } },
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
