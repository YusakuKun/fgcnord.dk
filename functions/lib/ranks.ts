/**
 * Rangliste-baserede Discord-roller for top 8.
 *
 * Rangering: én række pr. spiller — spillet hvor de har flest kampe
 * (deres "main game", tiebreak: højeste rating). Kræver >= 3 spillede kampe.
 * Top 8 efter rating får Discord-rollerne DISCORD_RANK_ROLE_1 .. _8.
 *
 * Hvem der har hvilken rolle gemmes i tabellen rank_role_assignments
 * (migration 0006), så vi kan fjerne roller igen UDEN at skulle hente
 * hele guildens medlemsliste (kræver privileged intent hos Discord).
 */

import { ResponseError, type Env } from "./api";

const MIN_MATCHES = 3;
export const TOP_N = 8;

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

/** Beregn top N på tværs af spil (main game pr. spiller). */
export async function computeTopRanks(
  db: D1Database,
  limit: number = TOP_N,
): Promise<RankedPlayer[]> {
  const rows = await db
    .prepare(
      `SELECT r.player_id, p.gamertag, p.discord_id, r.game, r.rating, r.matches_played
       FROM ratings r
       JOIN players p ON p.id = r.player_id
       WHERE r.matches_played >= ?`,
    )
    .bind(MIN_MATCHES)
    .all<RatingJoinRow>();

  // Main game = flest kampe; tiebreak: højeste rating
  const best = new Map<string, RatingJoinRow>();
  for (const row of rows.results || []) {
    const cur = best.get(row.player_id);
    if (
      !cur ||
      row.matches_played > cur.matches_played ||
      (row.matches_played === cur.matches_played && row.rating > cur.rating)
    ) {
      best.set(row.player_id, row);
    }
  }

  return [...best.values()]
    .sort((a, b) => b.rating - a.rating || b.matches_played - a.matches_played)
    .slice(0, limit)
    .map((row, i) => ({ rank: i + 1, ...row }));
}

function rankRoleId(env: Env, rank: number): string | undefined {
  const key = `DISCORD_RANK_ROLE_${rank}` as keyof Env;
  return env[key] as string | undefined;
}

export interface RankSyncResult {
  assigned: { rank: number; gamertag: string }[];
  removed: { rank: number; gamertag: string }[];
  skipped: string[];
}

/**
 * Synkronisér Discord-rollerne #1–#8 med ranglisten.
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

  const top = await computeTopRanks(db);

  // Eksisterende tildelinger fra sidste sync
  const current = await db
    .prepare(
      `SELECT a.player_id, a.rank, a.role_id, p.gamertag, p.discord_id
       FROM rank_role_assignments a
       JOIN players p ON p.id = a.player_id`,
    )
    .all<{
      player_id: string;
      rank: number;
      role_id: string;
      gamertag: string;
      discord_id: string | null;
    }>();

  const result: RankSyncResult = { assigned: [], removed: [], skipped: [] };
  const desired = new Map<string, { rank: number; roleId: string }>();
  for (const p of top) {
    const roleId = rankRoleId(env, p.rank);
    if (!roleId) {
      result.skipped.push(`#${p.rank} ${p.gamertag} (mangler DISCORD_RANK_ROLE_${p.rank})`);
      continue;
    }
    if (!p.discord_id) {
      result.skipped.push(`#${p.rank} ${p.gamertag} (ikke logget ind med Discord)`);
      continue;
    }
    desired.set(p.player_id, { rank: p.rank, roleId });
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

  // 1) Fjern roller fra spillere der ikke længere har den rang
  for (const row of current.results || []) {
    const want = desired.get(row.player_id);
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
      .prepare("DELETE FROM rank_role_assignments WHERE player_id = ?")
      .bind(row.player_id)
      .run();
    result.removed.push({ rank: row.rank, gamertag: row.gamertag });
  }

  // 2) Tildel nye/ændrede roller
  for (const p of top) {
    const want = desired.get(p.player_id);
    if (!want) continue;
    const has = (current.results || []).find(
      (r) => r.player_id === p.player_id && r.rank === want.rank,
    );
    if (has) continue; // allerede tildelt
    const ok = await discordApi(
      "PUT",
      `/guilds/${guildId}/members/${p.discord_id}/roles/${want.roleId}`,
    );
    if (ok) {
      await db
        .prepare(
          `INSERT INTO rank_role_assignments (player_id, rank, role_id, assigned_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT (player_id) DO UPDATE SET rank = excluded.rank, role_id = excluded.role_id, assigned_at = excluded.assigned_at`,
        )
        .bind(p.player_id, want.rank, want.roleId, Date.now())
        .run();
      result.assigned.push({ rank: want.rank, gamertag: p.gamertag });
    } else {
      result.skipped.push(
        `#${want.rank} ${p.gamertag} (Discord afviste — har botten Manage Roles, og ligger dens rolle over rang-rollerne?)`,
      );
    }
  }

  return result;
}
