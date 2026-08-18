-- Admin-controlled homepage notification (item 7).
--
-- A single-row settings table the landing popup reads: whether it shows, on which
-- pages, how often, and its copy. Run in Neon before this branch serves traffic;
-- the read layer falls back to sensible defaults if the table is missing.

CREATE TABLE IF NOT EXISTS announcement (
  id         smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- single row
  enabled    boolean  NOT NULL DEFAULT true,
  eyebrow    text     NOT NULL DEFAULT 'Founding Drop · Coming Soon',
  title      text     NOT NULL DEFAULT 'Be first to know when Adab drops.',
  body       text     NOT NULL DEFAULT 'Join the list for launch access and limited-drop notifications.',
  pages      text[]   NOT NULL DEFAULT ARRAY['/'],            -- route paths that show it
  frequency  text     NOT NULL DEFAULT 'once'
             CHECK (frequency IN ('once','session','always')),-- once ever / once per session / every visit
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO announcement (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
