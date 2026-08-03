-- Per-product "extra details": feature bullets, model note, and fabric/craft blurb.
ALTER TABLE products ADD COLUMN IF NOT EXISTS details     JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS model_note  TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric_note TEXT;

-- Backfill the two seeded products with the values that used to be hardcoded.
UPDATE products SET
  details = '["China Grace matte woven fabric","Band collar with structured placket","Concentric arch tonal embroidery on placket","Hem sits 1.5–2 inches below the crotch point","Relaxed sleeve, considered cuff","Designed and made in Bangladesh"]'::jsonb,
  model_note = 'Model is 5''9", athletic build, wearing size L.',
  fabric_note = 'Matte China Grace woven fabric with a soft, dry hand. Reinforced placket, tonal concentric arch embroidery, matte hardware, double-stitched hem.'
WHERE slug = 'adab-piran-warm-charcoal';

UPDATE products SET
  details = '["Bamboo-cotton fleece blend","Three gold-toned metal buttons","Geometric linear tonal embroidery on placket","Soft-lined hood, relaxed drop shoulder","Kangaroo pocket, ribbed cuff","Designed and made in Bangladesh"]'::jsonb,
  model_note = 'Model is 5''9", athletic build, wearing size L.',
  fabric_note = 'Bamboo-cotton fleece blend — soft, breathable, temperature-regulating. Three gold-toned metal buttons, geometric linear tonal embroidery, ribbed cuffs and hem.'
WHERE slug = 'adab-hoodie-steel-blue';
