import {
  ApiContext,
  ResponseError,
  corsHeaders,
  getOrigin,
  handleError,
  json,
} from "../../lib/api";
import { DOCS_CACHE_CONTROL, getPublishedGuide } from "../../lib/notion";

/**
 * GET /api/docs/:slug — én udgivet guide inkl. indholdsblokke.
 */
export async function onRequestGet(
  context: EventContext<Env, "slug", { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    const slug = context.params.slug as string;
    const guide = await getPublishedGuide(ctx.env, slug);
    if (!guide) {
      throw new ResponseError("Guiden findes ikke (eller er ikke udgivet).", 404);
    }
    return json(
      { guide },
      {
        headers: {
          ...corsHeaders(origin),
          "Cache-Control": DOCS_CACHE_CONTROL,
        },
      },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestOptions(
  context: EventContext<Env, "slug", { ctx: ApiContext }>,
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(getOrigin(context.data.ctx.request)),
  });
}
