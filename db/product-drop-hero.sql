-- Per-product hero for the Drop page (background image + overlay + text).
-- Stored as JSONB; only used when the product has a drop_date.
ALTER TABLE products ADD COLUMN IF NOT EXISTS drop_hero jsonb;
