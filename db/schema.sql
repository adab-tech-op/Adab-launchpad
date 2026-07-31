-- ADAB application schema for Neon Postgres.
-- Access is server-side only (Next.js server actions via DATABASE_URL), so there
-- are no anon GRANTs or RLS policies — validation happens in the server actions.
-- Neon Managed Better Auth manages its own users in the neon_auth schema.

-- Waitlist / newsletter signups -------------------------------------------------
CREATE TABLE IF NOT EXISTS waitlist_signups (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT NOT NULL,
  phone       TEXT,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_key
  ON waitlist_signups (lower(email));

-- Reservations (also the order records) -----------------------------------------
--   order_ref : shared across all line items from one checkout (e.g. "ADAB-7QK2P9")
--   status    : pending -> confirmed -> paid -> shipped -> delivered (or cancelled)
CREATE TABLE IF NOT EXISTS reservations (
  id                UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref         TEXT,
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT NOT NULL,
  product_slug      TEXT NOT NULL,
  size              TEXT NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1,
  delivery_address  TEXT,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','paid','shipped','delivered','cancelled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservations_order_ref_idx ON reservations (order_ref);
CREATE INDEX IF NOT EXISTS reservations_email_idx ON reservations (lower(email));

-- Contact form messages ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  order_number  TEXT,
  message       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
