-- Scrapbook: from gallery to scrapbook.
--
-- A uniform grid of equal tiles is a gallery — neutral and curated. A
-- scrapbook implies provenance (who, where, when) and variety (not every
-- item is a photograph). These columns carry that:
--
--   caption_bn  — the Bengali line, so captions read the way people write
--   place       — "Islampur Road, Dhaka"
--   taken_on    — free text, not a date type: "March 2026", "Eid morning"
--                 (a scrapbook's dates are approximate by nature)
--   credit      — "Rafi" or "@handle", for submitted moments. Attribution
--                 without the borrowed social-media chrome.
--   kind        — 'photo' | 'object'. An 'object' (a swatch, a thread card,
--                 a handwritten note, a sample tag) renders on paper stock
--                 with a slight tilt, which is what stops the page reading
--                 as a lookbook.
--   span        — 'normal' | 'tall' | 'wide'. Breaks the uniform rhythm so
--                 tiles stop having identical visual weight.
--   group_label — "Drop 01 · March 2026". A scrapbook has chronology; a
--                 grid has none.
--
-- Additive and idempotent; safe to re-run.

ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS caption_bn  TEXT NOT NULL DEFAULT '';
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS place       TEXT NOT NULL DEFAULT '';
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS taken_on    TEXT NOT NULL DEFAULT '';
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS credit      TEXT NOT NULL DEFAULT '';
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS kind        TEXT NOT NULL DEFAULT 'photo';
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS span        TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS group_label TEXT NOT NULL DEFAULT '';

-- Guard against typos from any future manual edit.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scrapbook_images_kind_chk') THEN
    ALTER TABLE scrapbook_images ADD CONSTRAINT scrapbook_images_kind_chk CHECK (kind IN ('photo', 'object'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scrapbook_images_span_chk') THEN
    ALTER TABLE scrapbook_images ADD CONSTRAINT scrapbook_images_span_chk CHECK (span IN ('normal', 'tall', 'wide'));
  END IF;
END $$;

-- The existing tile captioned "In the studio" is a street/tea-stall scene;
-- the actual studio shot is a different row. Rather than guess which is which,
-- this seeds only provenance that is safe to assert — nothing is overwritten
-- where an admin has already written something.
UPDATE scrapbook_images SET group_label = 'Drop 01'
  WHERE group_label = '';
