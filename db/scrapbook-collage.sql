-- Scrapbook collage placement.
--
-- A good collage is authored, not generated: random rotation and overlap
-- produce mush, while deliberate placement reads as someone having pinned
-- things to a board. These columns hold that authorship.
--
--   col_start / col_span — position on a 12-column desktop board. Columns
--                          rather than pixels so the board scales with the
--                          viewport instead of breaking at one width.
--   nudge_y              — pixels up (negative) or down, to tuck a card under
--                          its neighbour. This is what creates the overlap.
--   rotation             — degrees, -4..4. Authored per card so rotations
--                          vary and never fall into a visible pattern.
--
-- Tablet and mobile derive from sort_order and ignore these: at two columns
-- overlap is reduced to the seam, and at one column it is dropped entirely so
-- a card can never cover the caption beneath it.
--
-- Additive and idempotent; safe to re-run.

ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS col_start INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS col_span  INTEGER NOT NULL DEFAULT 4;
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS nudge_y   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scrapbook_images ADD COLUMN IF NOT EXISTS rotation  REAL    NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scrapbook_images_cols_chk') THEN
    ALTER TABLE scrapbook_images ADD CONSTRAINT scrapbook_images_cols_chk
      CHECK (col_start BETWEEN 0 AND 11 AND col_span BETWEEN 2 AND 12 AND col_start + col_span <= 12);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scrapbook_images_rot_chk') THEN
    ALTER TABLE scrapbook_images ADD CONSTRAINT scrapbook_images_rot_chk
      CHECK (rotation BETWEEN -4 AND 4);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scrapbook_images_nudge_chk') THEN
    ALTER TABLE scrapbook_images ADD CONSTRAINT scrapbook_images_nudge_chk
      CHECK (nudge_y BETWEEN -240 AND 240);
  END IF;
END $$;

-- Lay the existing tiles out as a starting board rather than stacking them all
-- in column 0: alternating columns, varied spans, small offsets and rotations.
-- Only touches rows still at the defaults, so admin placement is never undone.
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 AS n
  FROM scrapbook_images
)
UPDATE scrapbook_images s SET
  col_start = (ARRAY[0, 4, 8, 1, 5, 9, 0, 4, 8])[(n % 9) + 1],
  col_span  = (ARRAY[4, 4, 4, 4, 4, 3, 4, 4, 4])[(n % 9) + 1],
  nudge_y   = (ARRAY[0, 40, -20, 30, -30, 20, 10, -40, 25])[(n % 9) + 1],
  rotation  = (ARRAY[-1.9, 1.4, 2.7, -1.2, 2.4, -0.9, 1.6, -2.3, 2.0])[(n % 9) + 1]
FROM numbered
WHERE s.id = numbered.id AND s.col_start = 0 AND s.nudge_y = 0 AND s.rotation = 0;
