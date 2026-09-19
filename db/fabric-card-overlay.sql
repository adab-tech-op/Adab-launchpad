-- Care Guide card redesign: each fabric's photo becomes the card's full-bleed
-- side panel, so it needs its own overlay (colour / opacity / direction) the
-- way hero images do — photos vary in exposure and need tinting to sit
-- together on one cream page.
--
-- `at_a_glance` replaces the old hardcoded WASHING · DRYING · IRONING · STORAGE
-- label row, which was identical on every card and carried no information.
-- Kept as a single short line rather than parsed out of the care paragraphs,
-- which would be fragile.
--
-- Additive and idempotent; safe to re-run.

ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS at_a_glance      TEXT    NOT NULL DEFAULT '';
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS overlay_enabled  BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS overlay_color    TEXT    NOT NULL DEFAULT '#26364A';
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS overlay_opacity  INTEGER NOT NULL DEFAULT 16;
ALTER TABLE fabric_types ADD COLUMN IF NOT EXISTS overlay_from     TEXT    NOT NULL DEFAULT 'solid';

-- Seed the at-a-glance line for the four heritage fabrics, summarising the
-- care text already stored on each. Only fills rows still blank, so it never
-- clobbers an admin edit made after this first runs.
UPDATE fabric_types SET at_a_glance = 'Machine wash cold · Shade dry · Medium iron'
  WHERE slug = 'cotton' AND at_a_glance = '';

UPDATE fabric_types SET at_a_glance = 'Gentle cool wash · Line dry in shade · Iron damp'
  WHERE slug = 'linen' AND at_a_glance = '';

UPDATE fabric_types SET at_a_glance = 'Hand wash cold · Dry flat in shade · Medium iron'
  WHERE slug = 'khadi' AND at_a_glance = '';

UPDATE fabric_types SET at_a_glance = 'Hand wash · Air dry flat · Low iron'
  WHERE slug = 'muslin' AND at_a_glance = '';
