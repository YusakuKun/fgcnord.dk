const API_BASE = "/api";

async function fetchJson(
  path: string,
  init?: RequestInit,
): Promise<unknown> {
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

export async function joinAsGuest(gamertag: string) {
  return fetchJson("/auth/guest", {
    method: "POST",
    body: JSON.stringify({ gamertag }),
  }) as Promise<{ success: boolean; player: { id: string; gamertag: string } }>;
}

export async function logout() {
  return fetchJson("/auth/logout", { method: "POST" }) as Promise<{
    success: boolean;
  }>;
}

export async function getTournament(code: string) {
  return fetchJson(`/tournaments/${encodeURIComponent(code)}`) as Promise<
    TournamentPublic
  >;
}

export async function joinTournament(code: string) {
  return fetchJson(`/tournaments/${encodeURIComponent(code)}/join`, {
    method: "POST",
  }) as Promise<{ success: boolean; tournament_id: string }>;
}

export async function checkin(code: string) {
  return fetchJson(`/tournaments/${encodeURIComponent(code)}/checkin`, {
    method: "POST",
  }) as Promise<{ success: boolean }>;
}

export async function getTournamentMe(code: string) {
  return fetchJson(`/tournaments/${encodeURIComponent(code)}/me`) as Promise<{
    joined: boolean;
    player_id?: string;
    checked_in: boolean;
    seed: number | null;
    match: Match | null;
    matches: Match[];
  }>;
}

export async function getBracket(code: string) {
  return fetchJson(`/tournaments/${encodeURIComponent(code)}/bracket`) as Promise<{
    tournament: { id: string; name: string; status: string };
    entrants: { id: string; gamertag: string }[];
    matches: Match[];
  }>;
}

export async function reportMatch(
  matchId: string,
  score1: number,
  score2: number,
) {
  return fetchJson(`/matches/${encodeURIComponent(matchId)}`, {
    method: "POST",
    body: JSON.stringify({ score1, score2 }),
  }) as Promise<{ success: boolean; status: string; message?: string }>;
}

export async function confirmMatch(matchId: string) {
  return fetchJson(`/matches/${encodeURIComponent(matchId)}`, {
    method: "PUT",
  }) as Promise<{ success: boolean; status: string }>;
}

export async function disputeMatch(matchId: string) {
  return fetchJson(`/matches/${encodeURIComponent(matchId)}`, {
    method: "DELETE",
  }) as Promise<{ success: boolean; status: string; message?: string }>;
}

export interface TournamentPublic {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  join_code: string;
  startgg_slug: string | null;
  start_at: number | null;
  created_at: number;
  entrants: { id: string; gamertag: string; checked_in: number; seed: number | null }[];
  my_entry?: { checked_in: number; seed: number | null } | null;
}

/* ---------- Admin (kræver ADMIN_API_KEY som Bearer) ---------- */

async function fetchAdmin(
  path: string,
  adminKey: string,
  init?: RequestInit,
): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Tom nøgle = brug Discord-sessionen (@Admin-rolle) i stedet
      ...(adminKey ? { Authorization: `Bearer ${adminKey}` } : {}),
      ...init?.headers,
    },
  });
  const data = (await res.json().catch(() => ({
    error: "Uventet svar fra serveren.",
  }))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export interface AdminTournament {
  id: string;
  name: string;
  game: string;
  format: string;
  status: string;
  join_code: string;
  startgg_slug: string | null;
  start_at: number | null;
  created_at: number;
  entrants: number;
  checked_in: number;
}

export async function adminListTournaments(adminKey: string) {
  return fetchAdmin("/tournaments", adminKey) as Promise<{
    tournaments: AdminTournament[];
  }>;
}

export async function adminCreateTournament(
  adminKey: string,
  body: {
    name: string;
    game: string;
    format?: string;
    startgg_slug?: string;
    start_at?: number;
  },
) {
  return fetchAdmin("/tournaments", adminKey, {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<{
    success: boolean;
    tournament: {
      id: string;
      name: string;
      game: string;
      join_code: string;
    };
  }>;
}

export async function adminStartTournament(adminKey: string, code: string) {
  return fetchAdmin(
    `/tournaments/${encodeURIComponent(code)}/start`,
    adminKey,
    { method: "POST" },
  ) as Promise<{ success: boolean; matches: number }>;
}

/** Importér tilmeldte fra turneringens tilknyttede start.gg-event */
export async function adminImportEntrants(adminKey: string, code: string) {
  return fetchAdmin(
    `/tournaments/${encodeURIComponent(code)}/import-entrants`,
    adminKey,
    { method: "POST" },
  ) as Promise<{
    success: boolean;
    imported: number;
    alreadyRegistered: number;
    total: number;
    event: string;
  }>;
}

/** Send seeding (baseret på rangliste-rating) til start.gg-eventet */
export async function adminExportSeeding(adminKey: string, code: string) {
  return fetchAdmin(
    `/tournaments/${encodeURIComponent(code)}/export-seeding`,
    adminKey,
    { method: "POST" },
  ) as Promise<{
    success: boolean;
    event: string;
    phase: string;
    seeded: number;
    unmatchedSite: string[];
  }>;
}

/** Synkronisér Discord-rollerne #1–#8 med ranglisten */
export async function adminSyncRankRoles(adminKey: string) {
  return fetchAdmin("/admin/sync-rank-roles", adminKey, {
    method: "POST",
  }) as Promise<{
    success: boolean;
    assigned: { rank: number; gamertag: string }[];
    removed: { rank: number; gamertag: string }[];
    skipped: string[];
  }>;
}

/** Slet en turnering og alt tilknyttet data (tilmeldinger, kampe, lobby) */
export async function adminDeleteTournament(adminKey: string, code: string) {
  return fetchAdmin(
    `/admin/tournaments/${encodeURIComponent(code)}`,
    adminKey,
    { method: "DELETE" },
  ) as Promise<{
    ok: boolean;
    deleted: { id: string; name: string; join_code: string };
  }>;
}

/* ---------- Admin: lobby ---------- */

export async function adminOpenLobby(
  adminKey: string,
  body: { title: string; game: string; stations?: number },
) {
  return fetchAdmin("/lobby", adminKey, {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<{ success: boolean; lobby: { id: string; title: string } }>;
}

export async function adminCloseLobby(adminKey: string, lobbyId: string) {
  return fetchAdmin(
    `/lobby/${encodeURIComponent(lobbyId)}/close`,
    adminKey,
    { method: "POST" },
  ) as Promise<{ success: boolean }>;
}

export interface Match {
  id: string;
  tournament_id: string;
  round: number;
  slot: number;
  player1_id: string | null;
  player2_id: string | null;
  score1: number | null;
  score2: number | null;
  winner_id: string | null;
  status: string;
  reported_by: string | null;
  next_winner_match_id: string | null;
  next_loser_match_id: string | null;
  created_at: number;
}

/* ---------- Admin: start.gg resultat-import + annoncering ---------- */

export interface ImportResultsSummary {
  success: boolean;
  event: string;
  tournament: string;
  game: string;
  totalSets: number;
  imported: number;
  skipped: number;
  unmatched: string[];
}

/** Importér færdige sæt fra et start.gg-event til Elo-ranglisten */
export async function adminImportStartggResults(
  adminKey: string,
  slug: string,
  game?: string,
) {
  return fetchAdmin("/admin/import-startgg", adminKey, {
    method: "POST",
    body: JSON.stringify({ slug, ...(game ? { game } : {}) }),
  }) as Promise<ImportResultsSummary>;
}

/** Annoncér et start.gg-event på Discord (med ping til medlemsrollen) */
export async function adminAnnounceEvent(adminKey: string, slug: string) {
  return fetchAdmin("/admin/announce-event", adminKey, {
    method: "POST",
    body: JSON.stringify({ slug }),
  }) as Promise<{ success: boolean; event: string }>;
}
