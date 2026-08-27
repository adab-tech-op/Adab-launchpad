-- Fabric types + their care guides (editable in Studio → Fabrics). A product
-- links to one fabric type, and its Care Guide accordion shows that type's care.
-- Idempotent; safe to re-run.

CREATE TABLE IF NOT EXISTS fabric_types (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  care_detail TEXT NOT NULL DEFAULT '',
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products reference a fabric type; deleting a type just unlinks it (SET NULL).
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric_type_id INT REFERENCES fabric_types(id) ON DELETE SET NULL;

-- Seed heritage fabrics as ordinary editable/deletable rows.
INSERT INTO fabric_types (slug, name, care_detail, sort_order) VALUES
  ('cotton', 'Cotton', 'Machine wash cold, inside out, with like colours. Line dry in shade to keep the colour true. Warm iron while slightly damp. No bleach.', 1),
  ('linen',  'Linen',  'Hand or machine wash cool on a gentle cycle. Do not wring. Dry flat or on a hanger in shade. Iron on medium while still damp — soft creasing is natural to linen.', 2),
  ('khadi',  'Khadi',  'Handspun, handwoven cotton. Wash gently by hand in cold water for the first few washes, with a mild detergent and no bleach. Dry in shade. Khadi softens beautifully with age.', 3),
  ('muslin', 'Muslin', 'A fine, delicate weave. Hand wash cold with a mild detergent and never wring. Dry flat in shade. Iron on low with a cloth in between. Handle gently.', 4)
ON CONFLICT (slug) DO NOTHING;
