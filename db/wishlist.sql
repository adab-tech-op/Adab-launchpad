-- Wishlist: one row per (user, product). Tied to the Better Auth user id.
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id      TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_slug)
);
CREATE INDEX IF NOT EXISTS wishlist_items_user_idx ON wishlist_items (user_id);
