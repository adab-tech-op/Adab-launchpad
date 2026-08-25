-- Per-product overrides for the Fit & Sizing, Care Guide, and Delivery & Returns
-- accordions on the PDP (previously hardcoded in the page). Each is optional —
-- when a product leaves the field blank, the page falls back to the standard
-- copy, so the section always renders and boilerplate never needs retyping.
-- Idempotent; safe to re-run. No backfill needed (blank => default copy).

ALTER TABLE products ADD COLUMN IF NOT EXISTS fit_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_note TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS delivery_note TEXT;
