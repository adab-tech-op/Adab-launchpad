-- Marketing broadcast: suppression list + sent-log. Idempotent.
-- marketing_unsubscribes may already exist (referenced elsewhere); this is safe.
CREATE TABLE IF NOT EXISTS marketing_unsubscribes (
  email      TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id              SERIAL PRIMARY KEY,
  subject         TEXT NOT NULL,
  body_html       TEXT NOT NULL,
  recipient_count INT  NOT NULL DEFAULT 0,
  sent_count      INT  NOT NULL DEFAULT 0,
  sent_by         TEXT,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
