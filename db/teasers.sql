-- Admin-managed "coming soon" teaser cards for the shop grid. Off by default.
CREATE TABLE IF NOT EXISTS teasers (
  id         serial PRIMARY KEY,
  label      text NOT NULL DEFAULT '',
  subtext    text NOT NULL DEFAULT '',
  image_url  text NOT NULL DEFAULT '',
  sort_order int  NOT NULL DEFAULT 0,
  active     boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed one inactive teaser (from the old hardcoded filler) if the table is empty.
INSERT INTO teasers (label, subtext, image_url, active)
SELECT 'Pattern in development', 'Arriving in a future drop', '/assets/coming-soon-placeholder.jpg', false
WHERE NOT EXISTS (SELECT 1 FROM teasers);
