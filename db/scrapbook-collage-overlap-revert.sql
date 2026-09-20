-- Undo db/scrapbook-collage-overlap.sql.
--
-- That migration re-seeded the board with intersecting column ranges on the
-- assumption that intersecting columns produce overlap. They don't: CSS Grid
-- places items whose column ranges intersect on separate ROWS, so instead of
-- cards tucking under one another the board stretched into tall bands with a
-- single card in each. Reverting the code cannot undo an UPDATE that already
-- ran, hence this.
--
-- Restores the original seed (adjacent columns, small nudges), which held
-- together because adjacent ranges let cards share a row.
--
-- Only rewrites rows still carrying the bad seed's exact values, so any
-- placement adjusted in Studio since is left alone.
-- Idempotent; safe to re-run.

WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, id) - 1 AS n
  FROM scrapbook_images
)
UPDATE scrapbook_images s SET
  col_start = (ARRAY[0, 4, 8, 1, 5, 9, 0, 4, 8])[(numbered.n % 9) + 1],
  col_span  = (ARRAY[4, 4, 4, 4, 4, 3, 4, 4, 4])[(numbered.n % 9) + 1],
  nudge_y   = (ARRAY[0, 40, -20, 30, -30, 20, 10, -40, 25])[(numbered.n % 9) + 1]
FROM numbered
WHERE s.id = numbered.id
  -- the bad seed's fingerprint
  AND s.col_start = (ARRAY[0, 4, 7, 1, 5, 8, 2, 6, 3])[(numbered.n % 9) + 1]
  AND s.col_span  = (ARRAY[5, 5, 5, 5, 4, 4, 5, 5, 5])[(numbered.n % 9) + 1]
  AND s.nudge_y   = (ARRAY[0, 70, -40, -90, 40, -60, -110, 30, -80])[(numbered.n % 9) + 1];
