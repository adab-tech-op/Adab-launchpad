-- Account ↔ order linking for deferred (post-purchase) account creation.
--
-- Model: email is the system-of-record. A reservation may be placed as a guest
-- (user_id NULL) or by a signed-in customer (user_id set). When ANY account is
-- created for an email (via the post-payment "secure your reservation" CTA or an
-- organic signup), a Better Auth user.create hook claims every past guest order
-- with that email — see src/lib/auth.ts. This file adds the column + a one-time
-- backfill for orders placed before the feature existed.

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES "user" ("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reservations_user_id_idx ON reservations (user_id);

-- One-time backfill: link existing guest rows to any account sharing their email.
UPDATE reservations r
SET user_id = u."id"
FROM "user" u
WHERE r.user_id IS NULL
  AND lower(r.email) = lower(u."email");
