-- Product Story: a per-product narrative shown as the lead accordion on the PDP,
-- now editable from the studio product form (previously hardcoded in the page).
-- Idempotent; safe to re-run.

ALTER TABLE products ADD COLUMN IF NOT EXISTS story TEXT;

-- Optional backfill: preserve the piran's existing Product Story copy so it
-- doesn't vanish on the live product before an admin edits it. Only fills when
-- empty, so re-running won't clobber later edits. Adjust the slug if yours
-- differs; skip this statement entirely if you'd rather set every story by hand.
UPDATE products
SET story = 'A modern reinterpretation of the piran — the short-hemmed shirt worn across East Bengal in the 1950s and 60s, referenced by Bengali writer Rajshekhar Basu in 1958. Same DNA, new language.'
WHERE slug = 'adab-piran-warm-charcoal' AND (story IS NULL OR story = '');
