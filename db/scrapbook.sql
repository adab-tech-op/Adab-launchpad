-- Admin-managed scrapbook gallery. Idempotent.
CREATE TABLE IF NOT EXISTS scrapbook_images (
  id         SERIAL PRIMARY KEY,
  image_url  TEXT NOT NULL,
  caption    TEXT NOT NULL DEFAULT '',
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the current curated tiles, but only when the table is empty — so a
-- re-run never duplicates and never clobbers the admin's later changes.
INSERT INTO scrapbook_images (image_url, caption, sort_order)
SELECT v.image_url, v.caption, v.sort_order FROM (VALUES
  ('/assets/scrapbook-fitting.jpg',        'The first sample fitting', 1),
  ('/assets/scrapbook-fabric.jpg',         'Texture from home',        2),
  ('/assets/scrapbook-embroidery.jpg',     'Thread, close up',         3),
  ('/assets/scrapbook-1.jpg',              'In the studio',            4),
  ('/assets/product-detail-placket.jpg',   'Placket detail',           5),
  ('/assets/scrapbook-2.jpg',              'At the worktable',         6),
  ('/assets/scrapbook-community.jpg',      'Your Adab moment',         7),
  ('/assets/story-archival.jpg',           'Archival tone',            8)
) AS v(image_url, caption, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM scrapbook_images);
