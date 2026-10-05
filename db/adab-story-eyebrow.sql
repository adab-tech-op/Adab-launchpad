-- The Adab Story hero eyebrow still reads "Manifesto & History".
--
-- It survived the rename because nothing rendered it: Studio previewed and
-- offered the field, the page ignored it, so the stale value was invisible.
-- Now that the page shows it, the stored text has to be right.
--
-- Only rewrites the exact pre-rename string, so any wording chosen since is
-- left alone. Idempotent.

UPDATE page_content
SET content = jsonb_set(content, '{hero,eyebrow}', '"Adab Story"'),
    updated_at = now()
WHERE slug = 'manifesto'
  AND content->'hero'->>'eyebrow' = 'Manifesto & History';
