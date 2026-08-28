-- L2 coupon codes + frozen order pricing. Idempotent.
CREATE TABLE IF NOT EXISTS coupon_codes (
  id           SERIAL PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,          -- stored uppercase
  percent      INT  NOT NULL,                 -- 1..90
  product_slug TEXT,                          -- NULL = universal (all products)
  active       BOOLEAN NOT NULL DEFAULT true,
  expires_at   TIMESTAMPTZ,                   -- NULL = no expiry
  max_uses     INT,                           -- NULL = unlimited
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per order that applied a code. committed flips true at payment
-- submission (#11-style) and back to false on cancel/not-received, so caps and
-- once-per-email count only real (paid-intent) uses and self-heal.
CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id         SERIAL PRIMARY KEY,
  code_id    INT NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
  order_ref  TEXT NOT NULL,
  email      TEXT NOT NULL,
  committed  BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupon_redemptions_code_idx ON coupon_redemptions(code_id);
CREATE INDEX IF NOT EXISTS coupon_redemptions_order_idx ON coupon_redemptions(order_ref);

-- Frozen price for an order: the amount quoted at checkout, never recomputed.
CREATE TABLE IF NOT EXISTS order_pricing (
  order_ref     TEXT PRIMARY KEY,
  subtotal_bdt  INT NOT NULL,
  discount_code TEXT,
  discount_pct  INT NOT NULL DEFAULT 0,
  amount_bdt    INT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
