-- Admin-rolle: spillere med @Admin-rollen på Discord-serveren
-- får adgang til kontrolpanelet uden ADMIN_API_KEY.

ALTER TABLE players ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
