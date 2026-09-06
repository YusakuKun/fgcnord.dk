const API_BASE = "/api";

export interface RankEntry {
  rank: number;
  player_id: string;
  gamertag: string;
  game: string;
  rating: number;
  matches_played: number;
}

export type RanksResponse = Record<string, RankEntry[]>;

/**
 * Hent top 8 pr. spil som map: player_id → bedste rang på tværs af spil.
 * Fejler stille (tom map).
 */
export async function getRankMap(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_BASE}/ranks`, { credentials: "same-origin" });
    if (!res.ok) return {};
    const data = (await res.json()) as { ranks: RanksResponse };
    const map: Record<string, number> = {};
    for (const list of Object.values(data.ranks || {})) {
      for (const r of list || []) {
        const cur = map[r.player_id];
        if (cur === undefined || r.rank < cur) map[r.player_id] = r.rank;
      }
    }
    return map;
  } catch {
    return {};
  }
}

/**
 * Hent top 8 pr. spil som map: player_id → liste af { game, rank }
 * (til visning af hvilke spil spilleren er rangeret i).
 */
export async function getRankGamesMap(): Promise<
  Record<string, { game: string; rank: number }[]>
> {
  try {
    const res = await fetch(`${API_BASE}/ranks`, { credentials: "same-origin" });
    if (!res.ok) return {};
    const data = (await res.json()) as { ranks: RanksResponse };
    const map: Record<string, { game: string; rank: number }[]> = {};
    for (const [game, list] of Object.entries(data.ranks || {})) {
      for (const r of list || []) {
        (map[r.player_id] ||= []).push({ game, rank: r.rank });
      }
    }
    return map;
  } catch {
    return {};
  }
}
