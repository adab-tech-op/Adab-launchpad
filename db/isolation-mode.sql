-- Isolation mode + two additional admins.
--
-- Isolation mode closes the whole public site behind a sign-in gate: nobody
-- who is not a studio user (root / admin / moderator) sees anything but the
-- gate. Intended as a temporary pre-launch measure, toggleable from
-- Studio → Settings, and ON by default from now — including on first run,
-- before anyone has saved a setting, which is why the app's own default is
-- "enabled" rather than relying on this row existing.
--
-- Additive and idempotent; safe to re-run.

-- 1. Turn isolation on explicitly, so the state is visible in the settings
--    table rather than implied by code. Does not overwrite an existing choice:
--    if someone has already turned it off, leave it off.
INSERT INTO site_settings (key, value, updated_at)
VALUES ('isolation_mode', 'true'::jsonb, now())
ON CONFLICT (key) DO NOTHING;

-- 2. (removed) Two admins were seeded here. They are now invited through
--    Studio → Team like anyone else, and admin_roles is authoritative, so
--    seeding roles from a migration would defeat the ability to revoke them.
--    See db/reset-seeded-admins.sql.
