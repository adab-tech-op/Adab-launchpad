-- General key-value settings store for small global toggles/values set from the
-- studio (Latest count now; banner + offer-toggle will reuse this). Idempotent.

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the Latest count (how many newest products the /latest page shows).
INSERT INTO site_settings (key, value) VALUES ('latest_count', '3'::jsonb)
  ON CONFLICT (key) DO NOTHING;
