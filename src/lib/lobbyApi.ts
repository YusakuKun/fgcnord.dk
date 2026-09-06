const API_BASE = "/api";

async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = (await res.json().catch(() => ({
    error: "Uventet svar fra serveren.",
  }))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export interface LobbyAttendee {
  id: string;
  gamertag: string;
  discord_avatar: string | null;
  joined_at: number;
  rating: number | null;
  wins: number | null;
  losses: number | null;
}

export interface LobbyMatch {
  id: string;
  session_id: string;
  station: number | null;
  player1_id: string;
  player2_id: string;
  score1: number | null;
  score2: number | null;
  winner_id: string | null;
  status: string; // queued / called / reported / done / cancelled
  reported_by: string | null;
  created_at: number;
  finished_at: number | null;
  p1_tag: string;
  p2_tag: string;
}

export interface LobbyState {
  id: string;
  title: string;
  game: string;
  status: string;
  stations: number;
  created_at: number;
  closed_at: number | null;
  attendees: LobbyAttendee[];
  matches: LobbyMatch[];
}

export async function getCurrentLobby() {
  return fetchJson("/lobby") as Promise<{ lobby: LobbyState | null }>;
}

export async function joinLobby(lobbyId: string) {
  return fetchJson(`/lobby/${encodeURIComponent(lobbyId)}/join`, {
    method: "POST",
  }) as Promise<{ success: boolean }>;
}

/** Meld dig FRA lobbyen igen */
export async function leaveLobby(lobbyId: string) {
  return fetchJson(`/lobby/${encodeURIComponent(lobbyId)}/leave`, {
    method: "POST",
  }) as Promise<{ success: boolean }>;
}

/** Admin: fjern en spiller fra lobbyen (nøgle eller Discord @Admin-session) */
export async function adminKickFromLobby(
  adminKey: string,
  lobbyId: string,
  playerId: string,
) {
  const res = await fetch(`${API_BASE}/lobby/${encodeURIComponent(lobbyId)}/kick`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      // Tom nøgle = brug Discord-sessionen (@Admin-rolle) i stedet
      ...(adminKey ? { Authorization: `Bearer ${adminKey}` } : {}),
    },
    body: JSON.stringify({ player_id: playerId }),
  });
  const data = (await res.json().catch(() => ({
    error: "Uventet svar fra serveren.",
  }))) as { error?: string; success?: boolean; kicked?: string };
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as { success: boolean; kicked: string };
}

export async function challengePlayer(lobbyId: string, opponentId: string) {
  return fetchJson(`/lobby/${encodeURIComponent(lobbyId)}/matches`, {
    method: "POST",
    body: JSON.stringify({ opponent_id: opponentId }),
  }) as Promise<{ success: boolean; match_id: string; status: string; station: number | null }>;
}

export async function reportLobbyMatch(matchId: string, score1: number, score2: number) {
  return fetchJson(`/lobby/matches/${encodeURIComponent(matchId)}`, {
    method: "POST",
    body: JSON.stringify({ score1, score2 }),
  }) as Promise<{ success: boolean; status: string; message?: string }>;
}

export async function confirmLobbyMatch(matchId: string) {
  return fetchJson(`/lobby/matches/${encodeURIComponent(matchId)}`, {
    method: "PUT",
  }) as Promise<{
    success: boolean;
    status: string;
    rating?: { winner: number; winnerDelta: number; loser: number; loserDelta: number };
  }>;
}

export async function cancelLobbyMatch(matchId: string) {
  return fetchJson(`/lobby/matches/${encodeURIComponent(matchId)}`, {
    method: "DELETE",
  }) as Promise<{ success: boolean; status: string }>;
}

export interface LeaderboardRow {
  gamertag: string;
  discord_id: string | null;
  discord_avatar: string | null;
  rating: number;
  wins: number;
  losses: number;
  matches_played: number;
  updated_at: number;
}

export async function getLeaderboard(game: string) {
  return fetchJson(`/leaderboard?game=${encodeURIComponent(game)}`) as Promise<{
    game: string;
    players: LeaderboardRow[];
  }>;
}

export async function getMe() {
  return fetchJson("/me") as Promise<{
    authenticated: boolean;
    isMember: boolean;
    player?: { id: string; gamertag: string; username: string | null; avatarUrl: string | null };
  }>;
}
