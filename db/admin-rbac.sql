-- Admin RBAC + audit + invitations (Plan 2).
--
-- Introduces three studio roles (root / admin / moderator), an append-only audit
-- log, and an email-invitation flow. Replaces the ADMIN_EMAILS env allowlist as
-- the source of truth — though role resolution still FALLS BACK to the env
-- (ROOT_ADMIN_EMAIL -> root, ADMIN_EMAILS -> admin) for any email with no row
-- here, so existing admins never lose access and the first root can't be locked
-- out. Table rows win over env when both exist (so root can demote an env admin).
--
-- Run in Neon before the admin-rbac branch serves traffic. The read/gate layer
-- degrades gracefully to env-only if these tables are missing.

-- Roles ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_roles (
  email       TEXT PRIMARY KEY,           -- lowercased on write; email is the key
  role        TEXT NOT NULL CHECK (role IN ('root','admin','moderator')),
  invited_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only audit log --------------------------------------------------------
-- Every mutating studio action writes one row. The app exposes NO update/delete
-- path for this table — it is read-only to root and untouched by everyone else.
CREATE TABLE IF NOT EXISTS audit_log (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_email  TEXT NOT NULL,
  action       TEXT NOT NULL,             -- e.g. 'order.payment_status', 'product.delete'
  target       TEXT,                      -- the affected entity (order ref, slug, email)
  detail       JSONB,                     -- small structured context (before/after, values)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);

-- Invitations ------------------------------------------------------------------
-- Root invites an email at a chosen role. Single-use (accepted_at) and expiring.
CREATE TABLE IF NOT EXISTS admin_invitations (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('root','admin','moderator')),
  token       TEXT NOT NULL UNIQUE,
  invited_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS admin_invitations_email_idx ON admin_invitations (lower(email));
CREATE INDEX IF NOT EXISTS admin_invitations_token_idx ON admin_invitations (token);

-- Optional seed ----------------------------------------------------------------
-- Not required (env fallback covers existing admins), but makes the roster
-- explicit. Edit the emails, then run. The env fallback promotes ROOT_ADMIN_EMAIL
-- to root automatically, so seeding is a convenience, not a dependency.
--
--   INSERT INTO admin_roles (email, role) VALUES
--     ('you@example.com', 'root'),
--     ('ops@example.com', 'admin')
--   ON CONFLICT (email) DO NOTHING;
