const API_BASE = "/api";

export interface RankEntry {
  rank: number;
  player_id: string;
  gamertag: string;
  game: string;
  rating: number;
  matches_played: number;
}

/** Hent top 8 som map: player_id → rang. Fejler stille (tom map). */
export async function getRankMap(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_BASE}/ranks`, { credentials: "same-origin" });
    if (!res.ok) return {};
    const data = (await res.json()) as { ranks: RankEntry[] };
    const map: Record<string, number> = {};
    for (const r of data.ranks || []) map[r.player_id] = r.rank;
    return map;
  } catch {
    return {};
  }
}
