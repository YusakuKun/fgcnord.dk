import {
  ApiContext,
  corsHeaders,
  getOrigin,
  handleError,
  json,
  requireAdmin,
} from "../../lib/api";
import { DISCORD_COLORS, notifyDiscord } from "../../lib/discord";
import { computeTopRanks, syncRankRoles } from "../../lib/ranks";

/**
 * POST /api/admin/sync-rank-roles — synkronisér Discord-rollerne #1–#8
 * med ranglisten. Kaldes manuelt fra /admin og automatisk hvert kvartal
 * via GitHub Actions (se .github/workflows/rank-roles.yml).
 */
export async function onRequestPost(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);

    const top = await computeTopRanks(ctx.env.DB);
    const result = await syncRankRoles(ctx.env, ctx.env.DB);

    await notifyDiscord(ctx.env, {
      title: "🏆 Rang-roller opdateret",
      description:
        top.length === 0
          ? "Ingen spillere har nok ratede kampe endnu."
          : top
              .map(
                (p) =>
                  `**#${p.rank}** ${p.gamertag} — ${p.rating} rating (${p.game})`,
              )
              .join("\n"),
      color: DISCORD_COLORS.gold,
      footer: { text: "FGC Nord rangliste · kvartalsvis sync" },
    });

    return json(
      { success: true, top, ...result },
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
