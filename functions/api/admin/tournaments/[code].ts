/**
 * DELETE /api/admin/tournaments/:code — slet en turnering og alt tilknyttet
 * data (tilmeldinger, kampe, lobby-relationer).
 *
 * Kræver ADMIN_API_KEY (Bearer). Sletningen er permanent.
 * Børns rækker slettes eksplicit først, så det virker uanset om D1
 * håndhæver foreign keys eller ej.
 */

import {
  ApiContext,
  corsHeaders,
  getOrigin,
  handleError,
  json,
  requireAdmin,
  ResponseError,
} from "../../../lib/api";

export async function onRequestDelete(
  context: EventContext<Env, "code", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);

    const rawCode = context.params.code;
    const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode || "")
      .toUpperCase()
      .trim();
    if (!code || !/^[A-Z0-9]{4,8}$/.test(code)) {
      throw new ResponseError("Ugyldig join-kode.", 400);
    }

    const tournament = await ctx.env.DB.prepare(
      "SELECT id, name FROM tournaments WHERE join_code = ?",
    )
      .bind(code)
      .first<{ id: string; name: string }>();
    if (!tournament) {
      throw new ResponseError("Turnering ikke fundet.", 404);
    }
    const id = tournament.id;

    // Slet børn først (eksplicit — ikke afhængig af FK-håndhævelse).
    await ctx.env.DB.batch([
      ctx.env.DB.prepare(
        "DELETE FROM matches WHERE tournament_id = ?",
      ).bind(id),
      ctx.env.DB.prepare(
        "DELETE FROM entries WHERE tournament_id = ?",
      ).bind(id),
      ctx.env.DB.prepare(
        "DELETE FROM lobby_matches WHERE lobby_id IN (SELECT id FROM lobby_sessions WHERE tournament_id = ?)",
      ).bind(id),
      ctx.env.DB.prepare(
        "DELETE FROM lobby_attendees WHERE lobby_id IN (SELECT id FROM lobby_sessions WHERE tournament_id = ?)",
      ).bind(id),
      ctx.env.DB.prepare(
        "DELETE FROM lobby_sessions WHERE tournament_id = ?",
      ).bind(id),
      ctx.env.DB.prepare(
        "UPDATE sessions SET tournament_id = NULL WHERE tournament_id = ?",
      ).bind(id),
      ctx.env.DB.prepare(
        "DELETE FROM tournaments WHERE id = ?",
      ).bind(id),
    ]);

    return json(
      { ok: true, deleted: { id, name: tournament.name, join_code: code } },
      { status: 200, headers: corsHeaders(origin) },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}
