-- Rangliste-roller: hvem har hvilken top-8 Discord-rolle lige nu, PR. SPIL.
-- Erstatter skemaet fra 0006 (nu med game-kolonne og sammensat PK,
-- da en spiller kan have top-8 roller i flere spil samtidig).
-- Bruges af sync-funktionen til at fjerne gamle roller uden at hente
-- hele guildens medlemsliste (undgår privileged intent-krav).

DROP TABLE IF EXISTS rank_role_assignments;

CREATE TABLE rank_role_assignments (
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game TEXT NOT NULL,
  rank INTEGER NOT NULL,
  role_id TEXT NOT NULL,
  assigned_at INTEGER NOT NULL,
  PRIMARY KEY (player_id, game)
);

CREATE INDEX IF NOT EXISTS idx_rank_role_rank ON rank_role_assignments(game, rank);
