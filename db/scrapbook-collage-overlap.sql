-- Fix: the seeded board never overlapped.
--
-- db/scrapbook-collage.sql placed cards at columns 0 / 4 / 8 with span 4 —
-- perfectly adjacent, so no two cards ever share a column. `nudge_y` only
-- shifts a card vertically, which slides it past its neighbour rather than
-- over it. The result was a tidy tilted grid, not the overlapping pinboard.
--
-- This re-lays the board with intersecting column ranges (0-5 over 4-9 over
-- 7-12, and so on) and larger negative nudges, so cards genuinely tuck under
-- one another. z-index in the component already orders them by position, so
-- later cards sit above earlier ones.
--
-- Only touches rows still carrying the old seed's exact values, so any
-- placement an admin has since adjusted in Studio is left alone.
-- Idempotent; safe to re-run.

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 AS n
  FROM scrapbook_images
)
UPDATE scrapbook_images s SET
  col_start = (ARRAY[0, 4, 7, 1, 5, 8, 2, 6, 3])[(n % 9) + 1],
  col_span  = (ARRAY[5, 5, 5, 5, 4, 4, 5, 5, 5])[(n % 9) + 1],
  nudge_y   = (ARRAY[0, 70, -40, -90, 40, -60, -110, 30, -80])[(n % 9) + 1],
  rotation  = (ARRAY[-1.9, 1.4, 2.7, -1.2, 2.4, -0.9, 1.6, -2.3, 2.0])[(n % 9) + 1]
FROM numbered
WHERE s.id = numbered.id
  -- the old seed's exact fingerprint, so admin edits are never undone
  AND s.col_start = (ARRAY[0, 4, 8, 1, 5, 9, 0, 4, 8])[(numbered.n % 9) + 1]
  AND s.col_span  = (ARRAY[4, 4, 4, 4, 4, 3, 4, 4, 4])[(numbered.n % 9) + 1]
  AND s.nudge_y   = (ARRAY[0, 40, -20, 30, -30, 20, 10, -40, 25])[(numbered.n % 9) + 1];
