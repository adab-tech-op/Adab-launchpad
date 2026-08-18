-- Editable editorial content for Manifesto + Care guide (item 1).
--
-- One row per page; content is a JSON object of editable blocks. The page chrome
-- (hero, pull-quote, closing) and the icons/numerals stay in code — only the
-- blocks here are admin-editable. Run in Neon before this branch serves traffic;
-- pages fall back to their built-in defaults if the row/table is missing.

CREATE TABLE IF NOT EXISTS page_content (
  slug       text PRIMARY KEY,          -- 'manifesto' | 'care'
  content    jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No seed here — the app seeds from its in-code defaults on first save, and reads
-- fall back to those defaults until then. (Keeps this migration copy-free.)
