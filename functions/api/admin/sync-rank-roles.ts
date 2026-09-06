import {
  ApiContext,
  corsHeaders,
  getOrigin,
  handleError,
  json,
  requireAdmin,
} from "../../lib/api";
import { DISCORD_COLORS, notifyDiscord } from "../../lib/discord";
import { computeAllTopRanks, RANK_GAMES, syncRankRoles } from "../../lib/ranks";

const gameLabels: Record<string, string> = {
  melee: "Melee",
  ultimate: "Ultimate",
  roa2: "Rivals 2",
};

/**
 * POST /api/admin/sync-rank-roles — synkronisér Discord-rollerne #1–#8
 * for alle spil med deres respektive ranglister. Kaldes manuelt fra
 * /admin og automatisk hvert kvartal via GitHub Actions
 * (se .github/workflows/rank-roles.yml).
 */
export async function onRequestPost(
  context: EventContext<Env, never, { ctx: ApiContext }>,
): Promise<Response> {
  const ctx = context.data.ctx;
  const origin = getOrigin(ctx.request);
  try {
    requireAdmin(ctx);

    const topByGame = await computeAllTopRanks(ctx.env.DB);
    const result = await syncRankRoles(ctx.env, ctx.env.DB);

    const sections = RANK_GAMES.map((game) => {
      const list = topByGame[game];
      if (list.length === 0) return `**${gameLabels[game] || game}**\nIngen ratede spillere endnu.`;
      const lines = list.map(
        (p) => `**#${p.rank}** ${p.gamertag} — ${p.rating} rating`,
      );
      return `**${gameLabels[game] || game}**\n${lines.join("\n")}`;
    });

    await notifyDiscord(ctx.env, {
      title: "🏆 Rang-roller opdateret",
      description: sections.join("\n\n"),
      color: DISCORD_COLORS.gold,
      footer: { text: "FGC Nord rangliste · top 8 pr. spil · kvartalsvis sync" },
    });

    return json(
      { success: true, top: topByGame, ...result },
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
