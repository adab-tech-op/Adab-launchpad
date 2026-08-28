-- L1 product sale pricing. Idempotent.
-- discount_percent 0 = no sale. discount_until NULL = no expiry (always on while %>0).
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_until TIMESTAMPTZ;
