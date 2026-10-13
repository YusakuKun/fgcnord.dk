import {
  ApiContext,
  corsHeaders,
  getOrigin,
  handleError,
  json,
  requireAdmin,
} from "../../lib/api";
import { DISCORD_COLORS, notifyDiscord } from "../../lib/discord";
import { listPublishedGuides } from "../../lib/notion";

/**
 * POST /api/admin/announce-docs?hours=24 — annoncér guides der er udgivet/
 * opdateret for nylig, som embed på Discord. Kaldes dagligt af GitHub Actions
 * (docs-announce.yml) med admin-nøglen, eller manuelt fra /admin.
 */
export async function onRequestPost(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);
    const url = new URL(ctx.request.url);
    const hours = Math.min(Number(url.searchParams.get("hours")) || 24, 24 * 30);
    const cutoff = Date.now() - hours * 60 * 60 * 1000;

    const guides = await listPublishedGuides(ctx.env);
    const fresh = guides.filter(
      (g) => new Date(g.lastEdited).getTime() >= cutoff,
    );

    if (fresh.length > 0) {
      const siteOrigin = url.origin;
      await notifyDiscord(ctx.env, {
        title: "📚 Nye/opdaterede guides på fgcnord.dk",
        description: fresh
          .map((g) => `• [${g.title}](${siteOrigin}/docs/${g.slug})`)
          .join("\n"),
        color: DISCORD_COLORS.brick,
        footer: { text: "Skrevet i Notion, udgivet automatisk" },
      });
    }

    return json(
      { announced: fresh.length, titles: fresh.map((g) => g.title) },
      { headers: corsHeaders(origin) },
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
