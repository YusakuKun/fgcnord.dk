import { corsHeaders, getOrigin, handleError, json } from "../lib/api";
import { readSession } from "../lib/session";

interface MemberPlayerRow {
  id: string;
  gamertag: string;
  discord_username: string | null;
  discord_avatar: string | null;
  is_member: number;
  is_admin: number;
  member_since: number | null;
}

/**
 * Live-tjek af roller via Discord-botten.
 * Returnerer null ved manglende config eller fejl — så rører vi ikke DB-status.
 */
async function fetchLiveRoles(
  env: {
    DISCORD_BOT_TOKEN?: string;
    DISCORD_GUILD_ID?: string;
    DISCORD_MEMBER_ROLE_ID?: string;
    DISCORD_ADMIN_ROLE_ID?: string;
  },
  discordUserId: string,
): Promise<{ isMember: boolean; isAdmin: boolean } | null> {
  const botToken = env.DISCORD_BOT_TOKEN;
  const guildId = env.DISCORD_GUILD_ID;
  const roleId = env.DISCORD_MEMBER_ROLE_ID;
  const adminRoleId = env.DISCORD_ADMIN_ROLE_ID;
  if (!botToken || !guildId) return null;
  try {
    const res = await fetch(
      `https://discord.com/api/guilds/${guildId}/members/${discordUserId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (res.ok) {
      const member = (await res.json()) as { roles?: string[] };
      const roles = Array.isArray(member.roles) ? member.roles : [];
      // Medlemskab = medlemsrollen på serveren. Er rollen ikke konfigureret,
      // tæller rent server-medlemskab.
      return {
        isMember: roleId ? roles.includes(roleId) : true,
        isAdmin: adminRoleId ? roles.includes(adminRoleId) : false,
      };
    }
    if (res.status === 404) return { isMember: false, isAdmin: false };
    return null;
  } catch {
    return null;
  }
}

/**
 * GET /api/me — login- og medlemsstatus for den aktuelle session.
 * Bruges fx af /bliv-medlem til at vise "du er medlem"-kortet.
 *
 * Medlemsstatus gen-tjekkes live mod Discord ved hvert kald (hvis botten er
 * konfigureret), så en ny tildelt rolle slår igennem uden gen-login.
 */
export async function onRequestGet(
  context: EventContext<Env, never, unknown>,
): Promise<Response> {
  const origin = getOrigin(context.request);
  try {
    const { session, player } = await readSession(
      context.request,
      context.env.DB,
      context.env.SESSION_SECRET,
    );

    if (!session || !player) {
      return json(
        { authenticated: false, isMember: false, isAdmin: false },
        { headers: corsHeaders(origin) },
      );
    }

    const row = await context.env.DB.prepare(
      "SELECT id, gamertag, discord_username, discord_avatar, is_member, is_admin, member_since FROM players WHERE id = ?",
    )
      .bind(player.id)
      .first<MemberPlayerRow>();

    let isMember = row?.is_member === 1;
    let isAdmin = row?.is_admin === 1;
    let memberSince = row?.member_since ?? null;

    // Live gen-tjek af medlems- og admin-rollen (kræver bot token + guild id)
    if (player.discord_id) {
      const live = await fetchLiveRoles(context.env, player.discord_id);
      if (live !== null && (live.isMember !== isMember || live.isAdmin !== isAdmin)) {
        isMember = live.isMember;
        isAdmin = live.isAdmin;
        memberSince = live.isMember ? (memberSince ?? Date.now()) : null;
        await context.env.DB.prepare(
          "UPDATE players SET is_member = ?, is_admin = ?, member_since = ? WHERE id = ?",
        )
          .bind(live.isMember ? 1 : 0, live.isAdmin ? 1 : 0, memberSince, player.id)
          .run();
      }
    }

    const avatarUrl =
      row?.discord_avatar && player.discord_id
        ? `https://cdn.discordapp.com/avatars/${player.discord_id}/${row.discord_avatar}.png?size=128`
        : null;

    return json(
      {
        authenticated: true,
        isMember,
        isAdmin,
        memberSince,
        player: {
          id: row?.id ?? player.id,
          gamertag: row?.gamertag ?? player.gamertag,
          username: row?.discord_username ?? null,
          avatarUrl,
        },
      },
      { headers: corsHeaders(origin) },
    );
  } catch (err) {
    return handleError(err, origin);
  }
}

export async function onRequestOptions(
  context: EventContext<Env, never, unknown>,
): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(getOrigin(context.request)),
  });
}
