import {
  ApiContext,
  corsHeaders,
  getOrigin,
  handleError,
  json,
} from "../lib/api";
import { computeTopRanks } from "../lib/ranks";

/**
 * GET /api/ranks — offentlig top 8 på tværs af spil.
 * Bruges til rang-badges i lobbyen og på turneringssider.
 */
export async function onRequestGet(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const ranks = await computeTopRanks(ctx.env.DB);
    return json(
      { ranks },
      {
        headers: {
          ...corsHeaders(origin),
          // Ranglisten ændrer sig sjældent — cache et minut
          "Cache-Control": "public, max-age=60",
        },
      },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestOptions(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(getOrigin(context.data.ctx.request)),
  });
}
