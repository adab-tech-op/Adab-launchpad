-- DB-backed catalog. price_bdt is an integer (৳ formatting happens in code).
-- swatches: [{name,hex}], images: [url,...] stored as JSONB.
CREATE TABLE IF NOT EXISTS products (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Preview' CHECK (status IN ('Preview','Available','Coming Soon')),
  price_bdt     INTEGER NOT NULL,
  founding_note TEXT,
  color         TEXT NOT NULL,
  swatches      JSONB NOT NULL DEFAULT '[]'::jsonb,
  short         TEXT NOT NULL,
  images        JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the two existing products (safe to re-run).
INSERT INTO products (slug, name, status, price_bdt, founding_note, color, swatches, short, images, sort_order)
VALUES
(
  'adab-piran-warm-charcoal',
  'Adab Piran — Warm Charcoal',
  'Preview',
  4500,
  'Founding price — final price to follow',
  'Warm Charcoal',
  '[{"name":"Warm Charcoal","hex":"#2b2b2e"},{"name":"Parchment","hex":"#f5f0e8"}]'::jsonb,
  'A modern piran in matte China Grace woven fabric — band collar, concentric arch tonal embroidery on the placket, hem sitting 1.5–2 inches below the crotch.',
  '["/assets/product-piran-main.jpg","/assets/product-piran-detail.jpg","/assets/product-piran-main.jpg","/assets/product-piran-detail.jpg"]'::jsonb,
  1
),
(
  'adab-hoodie-steel-blue',
  'Adab Hoodie — Steel Blue',
  'Preview',
  7000,
  'Founding price — final price to follow',
  'Steel Blue',
  '[{"name":"Steel Blue","hex":"#4682b4"},{"name":"Prussian","hex":"#003153"}]'::jsonb,
  'Bamboo-cotton fleece hoodie with three gold-toned metal buttons and geometric linear tonal embroidery on the placket.',
  '["/assets/product-hoodie-main.jpg","/assets/product-hoodie-detail.jpg","/assets/product-hoodie-main.jpg","/assets/product-hoodie-detail.jpg"]'::jsonb,
  2
)
ON CONFLICT (slug) DO NOTHING;
