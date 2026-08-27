-- Inventory core: per-size stock, product sold-out latch, and a flag that makes
-- stock decrement/restore idempotent across payment re-submits. Idempotent.

CREATE TABLE IF NOT EXISTS product_sizes (
  product_slug TEXT NOT NULL REFERENCES products(slug) ON DELETE CASCADE,
  size         TEXT NOT NULL,
  stock        INT  NOT NULL DEFAULT 0,
  PRIMARY KEY (product_slug, size)
);

-- One-way sold-out latch (set once, never unset — see markSoldOut).
ALTER TABLE products ADD COLUMN IF NOT EXISTS sold_out BOOLEAN NOT NULL DEFAULT false;

-- True once an order's stock has been decremented, so re-submitting payment
-- can't double-decrement and a release restores exactly once.
ALTER TABLE order_state ADD COLUMN IF NOT EXISTS stock_committed BOOLEAN NOT NULL DEFAULT false;
