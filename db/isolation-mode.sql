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

-- 2. The two new admins. admin_roles is the real RBAC source (email is the
--    primary key, lowercased on write). ON CONFLICT DO NOTHING so an existing
--    role — including root — is never demoted by re-running this.
INSERT INTO admin_roles (email, role, invited_by)
VALUES
  ('islam83.safiqul@gmail.com', 'admin', 'isolation-mode migration'),
  ('dasgupta.bitop@gmail.com',  'admin', 'isolation-mode migration')
ON CONFLICT (email) DO NOTHING;
