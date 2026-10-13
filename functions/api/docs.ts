import {
  ApiContext,
  corsHeaders,
  getOrigin,
  handleError,
  json,
} from "../lib/api";
import { DOCS_CACHE_CONTROL, listPublishedGuides } from "../lib/notion";

/**
 * GET /api/docs — offentlig liste over udgivne guides fra Notion.
 * Kun guides med Status = "Published" i FGCNORD Admin Docs-databasen.
 */
export async function onRequestGet(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const docs = await listPublishedGuides(ctx.env);
    return json(
      { docs },
      {
        headers: {
          ...corsHeaders(origin),
          // Guides ændrer sig sjældent — cache 5 minutter
          "Cache-Control": DOCS_CACHE_CONTROL,
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
