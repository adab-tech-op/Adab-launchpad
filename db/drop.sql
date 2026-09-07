-- Per-product drop scheduling. All nullable/defaulted — safe to run anytime.
-- drop_date : when the piece drops (becomes purchaseable). Stored UTC; the
--             studio sets it in Asia/Dhaka.
-- drop_end  : optional. Auto-concludes the drop when it passes. "Close drop"
--             in the studio just sets this to now(). Must be after drop_date.
-- in_shop   : once a drop has concluded, an admin can flip this on to resurface
--             the piece in /shop only (it never returns to /drop).
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_date timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_end  timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS in_shop   boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_drop_date ON products (drop_date);
