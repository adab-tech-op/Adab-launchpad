-- Per-user profile extras (name/email live on the Better Auth "user" table).
CREATE TABLE IF NOT EXISTS profiles (
  user_id       TEXT NOT NULL PRIMARY KEY REFERENCES "user" ("id") ON DELETE CASCADE,
  phone         TEXT,
  default_size  TEXT,
  address_line  TEXT,
  city          TEXT,
  area          TEXT,
  postal_code   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
