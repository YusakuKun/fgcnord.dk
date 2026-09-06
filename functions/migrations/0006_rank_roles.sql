-- Rangliste-roller: hvem har hvilken top-8 Discord-rolle lige nu.
-- Bruges af sync-funktionen til at fjerne gamle roller uden at hente
-- hele guildens medlemsliste (undgår privileged intent-krav).

CREATE TABLE IF NOT EXISTS rank_role_assignments (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  role_id TEXT NOT NULL,
  assigned_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rank_role_rank ON rank_role_assignments(rank);
