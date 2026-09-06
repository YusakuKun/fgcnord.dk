/**
 * Rangliste-baserede Discord-roller for top 8 — PR. SPIL.
 *
 * Der er en selvstændig rangliste pr. spil (melee, ultimate, roa2),
 * og hver spil har sine egne 8 Discord-roller:
 *   DISCORD_MELEE_RANK_ROLE_1 .. _8
 *   DISCORD_ULTIMATE_RANK_ROLE_1 .. _8
 *   DISCORD_ROA2_RANK_ROLE_1 .. _8
 * En spiller kan godt have top-8 roller i flere spil samtidig.
 * Kræver >= 3 spillede kampe i det pågældende spil.
 *
 * Hvem der har hvilken rolle gemmes i tabellen rank_role_assignments
 * (migration 0007, PK = player_id + game), så vi kan fjerne roller igen
 * UDEN at hente hele guildens medlemsliste (kræver privileged intent).
 */

import { ResponseError, type Env } from "./api";

const MIN_MATCHES = 3;
export const TOP_N = 8;
export const RANK_GAMES = ["melee", "ultimate", "roa2"] as const;
export type RankGame = (typeof RANK_GAMES)[number];

export interface RankedPlayer {
  rank: number;
  player_id: string;
  gamertag: string;
  discord_id: string | null;
  game: string;
  rating: number;
  matches_played: number;
}

interface RatingJoinRow {
  player_id: string;
  gamertag: string;
  discord_id: string | null;
  game: string;
  rating: number;
  matches_played: number;
}

/** Beregn top N for ÉT spil, sorteret efter rating. */
export async function computeTopRanks(
  db: D1Database,
  game: string,
  limit: number = TOP_N,
): Promise<RankedPlayer[]> {
  const rows = await db
    .prepare(
      `SELECT r.player_id, p.gamertag, p.discord_id, r.game, r.rating, r.matches_played
       FROM ratings r
       JOIN players p ON p.id = r.player_id
       WHERE r.game = ? AND r.matches_played >= ?
       ORDER BY r.rating DESC, r.matches_played DESC
       LIMIT ?`,
    )
    .bind(game, MIN_MATCHES, limit)
    .all<RatingJoinRow>();

  return (rows.results || []).map((row, i) => ({ rank: i + 1, ...row }));
}

/** Beregn top N for alle spil på én gang: { melee: [...], ultimate: [...], roa2: [...] } */
export async function computeAllTopRanks(
  db: D1Database,
  limit: number = TOP_N,
): Promise<Record<string, RankedPlayer[]>> {
  const out: Record<string, RankedPlayer[]> = {};
  for (const game of RANK_GAMES) {
    out[game] = await computeTopRanks(db, game, limit);
  }
  return out;
}

/** Env-var-navn for en given spil+rang, fx DISCORD_MELEE_RANK_ROLE_1 */
export function rankRoleEnvKey(game: string, rank: number): string {
  return `DISCORD_${game.toUpperCase()}_RANK_ROLE_${rank}`;
}

function rankRoleId(env: Env, game: string, rank: number): string | undefined {
  return env[rankRoleEnvKey(game, rank) as keyof Env] as string | undefined;
}

export interface RankSyncResult {
  assigned: { rank: number; gamertag: string; game: string }[];
  removed: { rank: number; gamertag: string; game: string }[];
  skipped: string[];
}

/**
 * Synkronisér Discord-rollerne #1–#8 for ALLE spil med ranglisterne.
 * Bot-tokenet skal have "Manage Roles", og bottens egen rolle skal ligge
 * OVER rang-rollerne i serverens rolle-hierarki.
 */
export async function syncRankRoles(
  env: Env,
  db: D1Database,
): Promise<RankSyncResult> {
  const botToken = env.DISCORD_BOT_TOKEN;
  const guildId = env.DISCORD_GUILD_ID;
  if (!botToken || !guildId) {
    throw new ResponseError(
      "Rang-roller kræver DISCORD_BOT_TOKEN og DISCORD_GUILD_ID.",
      503,
    );
  }

  const topByGame = await computeAllTopRanks(db);

  // Eksisterende tildelinger fra sidste sync
  const current = await db
    .prepare(
      `SELECT a.player_id, a.game, a.rank, a.role_id, p.gamertag, p.discord_id
       FROM rank_role_assignments a
       JOIN players p ON p.id = a.player_id`,
    )
    .all<{
      player_id: string;
      game: string;
      rank: number;
      role_id: string;
      gamertag: string;
      discord_id: string | null;
    }>();

  const result: RankSyncResult = { assigned: [], removed: [], skipped: [] };

  // Ønsket tilstand: (player_id|game) → { rank, roleId, gamertag }
  const desired = new Map<string, { rank: number; roleId: string; gamertag: string }>();
  for (const game of RANK_GAMES) {
    for (const p of topByGame[game]) {
      const roleId = rankRoleId(env, game, p.rank);
      if (!roleId) {
        result.skipped.push(
          `${game} #${p.rank} ${p.gamertag} (mangler ${rankRoleEnvKey(game, p.rank)})`,
        );
        continue;
      }
      if (!p.discord_id) {
        result.skipped.push(`${game} #${p.rank} ${p.gamertag} (ikke logget ind med Discord)`);
        continue;
      }
      desired.set(`${p.player_id}|${game}`, { rank: p.rank, roleId, gamertag: p.gamertag });
    }
  }

  const discordApi = async (method: string, path: string): Promise<boolean> => {
    try {
      const res = await fetch(`https://discord.com/api${path}`, {
        method,
        headers: { Authorization: `Bot ${botToken}` },
      });
      return res.ok || res.status === 204;
    } catch {
      return false;
    }
  };

  // 1) Fjern roller fra spillere der ikke længere har den rang i det spil
  for (const row of current.results || []) {
    const want = desired.get(`${row.player_id}|${row.game}`);
    if (want && want.rank === row.rank && want.roleId === row.role_id) {
      continue; // korrekt rolle allerede
    }
    if (row.discord_id) {
      await discordApi(
        "DELETE",
        `/guilds/${guildId}/members/${row.discord_id}/roles/${row.role_id}`,
      );
    }
    await db
      .prepare("DELETE FROM rank_role_assignments WHERE player_id = ? AND game = ?")
      .bind(row.player_id, row.game)
      .run();
    result.removed.push({ rank: row.rank, gamertag: row.gamertag, game: row.game });
  }

  // 2) Tildel nye/ændrede roller
  for (const game of RANK_GAMES) {
    for (const p of topByGame[game]) {
      const want = desired.get(`${p.player_id}|${game}`);
      if (!want) continue;
      const has = (current.results || []).find(
        (r) => r.player_id === p.player_id && r.game === game && r.rank === want.rank,
      );
      if (has) continue; // allerede tildelt
      const ok = await discordApi(
        "PUT",
        `/guilds/${guildId}/members/${p.discord_id}/roles/${want.roleId}`,
      );
      if (ok) {
        await db
          .prepare(
            `INSERT INTO rank_role_assignments (player_id, game, rank, role_id, assigned_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT (player_id, game) DO UPDATE SET rank = excluded.rank, role_id = excluded.role_id, assigned_at = excluded.assigned_at`,
          )
          .bind(p.player_id, game, want.rank, want.roleId, Date.now())
          .run();
        result.assigned.push({ rank: want.rank, gamertag: p.gamertag, game });
      } else {
        result.skipped.push(
          `${game} #${want.rank} ${p.gamertag} (Discord afviste — har botten Manage Roles, og ligger dens rolle over rang-rollerne?)`,
        );
      }
    }
  }

  return result;
}
