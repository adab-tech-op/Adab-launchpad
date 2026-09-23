-- Reset the two seeded admin addresses to a clean slate.
--
-- They were granted the admin role by a hardcoded list in the application
-- code, not through the normal invite flow. That list is now gone (see
-- src/lib/admin.ts), and admin_roles is authoritative — so this removes any
-- leftover traces, letting both addresses be invited from Studio → Team like
-- anybody else and go through the ordinary accept-and-sign-up process.
--
-- Nothing here touches the bootstrap owner (abdr.razzak2026@gmail.com) or any
-- other admin.
--
-- Safe to run whether or not the earlier seeding ever happened: every
-- statement is a conditional delete. Idempotent.

BEGIN;

-- 1. Any admin_roles rows created by db/isolation-mode.sql.
DELETE FROM admin_roles
WHERE lower(email) IN ('islam83.safiqul@gmail.com', 'dasgupta.bitop@gmail.com');

-- 2. Any pending invitations, so a fresh invite is not blocked by a stale one.
DELETE FROM admin_invitations
WHERE lower(email) IN ('islam83.safiqul@gmail.com', 'dasgupta.bitop@gmail.com');

-- 3. Any login accounts created by scripts/seed-admin-accounts.mjs.
--    That script almost certainly never ran (the command errored), so these
--    will usually match nothing — but if it did run, the accounts carry a
--    shared starter password and must not survive.
--
--    Sessions and credential rows are removed first: "user" is referenced by
--    both, and leaving them would either orphan rows or fail on the FK.
--
--    IMPORTANT: this deletes the whole user record. If either address turns
--    out to have a real CUSTOMER account with order history, do NOT run this
--    section — check first:
--      SELECT u.email, count(o.*) FROM "user" u
--      LEFT JOIN orders o ON lower(o.email) = lower(u.email)
--      WHERE lower(u.email) IN ('islam83.safiqul@gmail.com','dasgupta.bitop@gmail.com')
--      GROUP BY u.email;
--    A non-zero count means a real customer; delete only the "account" row in
--    that case so the password goes but the person stays.

DELETE FROM "session"
WHERE "userId" IN (
  SELECT id FROM "user"
  WHERE lower(email) IN ('islam83.safiqul@gmail.com', 'dasgupta.bitop@gmail.com')
);

DELETE FROM "account"
WHERE "userId" IN (
  SELECT id FROM "user"
  WHERE lower(email) IN ('islam83.safiqul@gmail.com', 'dasgupta.bitop@gmail.com')
);

DELETE FROM "user"
WHERE lower(email) IN ('islam83.safiqul@gmail.com', 'dasgupta.bitop@gmail.com');

COMMIT;
