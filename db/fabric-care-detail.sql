-- Extends fabric_types with a thumbnail image + structured care sections
-- (little details / washing / drying / ironing / storage) so the Care Guide
-- page can show a searchable card grid and a per-fabric popup with full
-- sectioned instructions. Additive — existing `care_detail` column is left
-- in place (still used as the Care Guide accordion fallback on the PDP).
-- Idempotent; safe to re-run.

ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS thumbnail_url TEXT NOT NULL DEFAULT '';
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS details       TEXT NOT NULL DEFAULT ''; -- "Little details" card blurb
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS washing       TEXT NOT NULL DEFAULT '';
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS drying        TEXT NOT NULL DEFAULT '';
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS ironing       TEXT NOT NULL DEFAULT '';
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS storage       TEXT NOT NULL DEFAULT '';

-- Seed real care content for the 4 heritage fabrics (only fills rows that are
-- still blank on the new columns, so it never clobbers admin edits made after
-- this migration first runs).
UPDATE fabric_types SET
  details = 'Breathable and durable — everyday cotton that gets softer with every wash and holds colour well when cared for gently.',
  washing = 'Machine wash cold to warm, inside out, with similar colours. A gentle detergent keeps the fibres and any embroidery intact. Skip the bleach.',
  drying  = 'Line dry in the shade where possible. If you use a dryer, keep it on low-to-medium heat and pull the piece out while still a little damp.',
  ironing = 'Iron on medium-to-high heat, ideally while the fabric is still slightly damp, and turn the piece inside out to protect any print or embroidery.',
  storage = 'Fold and store somewhere cool and dry, out of direct sunlight, to keep the colour from fading over time.'
WHERE slug = 'cotton' AND washing = '';

UPDATE fabric_types SET
  details = 'A light, textured weave that softens beautifully with age. A little creasing is part of linen''s character, not a flaw.',
  washing = 'Machine or hand wash on a gentle, cool cycle. Avoid wringing — let the fabric''s own weight do the work.',
  drying  = 'Lay flat or hang to dry in the shade. Tumble drying on low is fine in a hurry, but line drying keeps the drape truest.',
  ironing = 'Iron while still slightly damp, on medium-to-high heat. The relaxed crease that remains afterwards is normal linen texture, not a mistake.',
  storage = 'Store folded or loosely hung in a dry space. Make sure it''s fully dry first — packing it away damp invites mildew.'
WHERE slug = 'linen' AND washing = '';

UPDATE fabric_types SET
  details = 'Hand-spun, hand-woven cotton with a soft, textured hand-feel. It''s a slower fabric to make and a slower one to wash — treat it gently and it rewards you for years.',
  washing = 'Hand wash in cold water with a mild detergent, especially for the first few washes. Keep dark and light pieces separate to avoid any colour transfer.',
  drying  = 'Dry flat or hang in the shade — never in direct sun. Khadi takes a little longer to dry than machine-made cotton; that''s normal.',
  ironing = 'Iron on medium heat while the fabric is still a little damp, on the reverse side if there''s embroidery.',
  storage = 'Fold and store in a cool, dry place. A breathable cotton bag is better than plastic, which can trap moisture.'
WHERE slug = 'khadi' AND washing = '';

UPDATE fabric_types SET
  details = 'A fine, airy weave — light on the skin, but it asks for a gentler hand at the wash than sturdier cottons.',
  washing = 'Hand wash or use a delicate machine cycle in cool water with a mild detergent. Never wring — gently squeeze out the water instead.',
  drying  = 'Air dry flat, away from direct sunlight. Avoid the tumble dryer where you can; if you must, use the lowest heat setting.',
  ironing = 'Iron on low heat only, with a pressing cloth between the iron and the fabric if there''s any print or embroidery.',
  storage = 'Make sure it''s completely dry before folding away in a cool, dry spot — muslin holds onto dampness longer than heavier cotton.'
WHERE slug = 'muslin' AND washing = '';
