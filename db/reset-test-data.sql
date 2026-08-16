-- Manual pre-launch data reset (alternative to the /studio/data Danger Zone).
--
-- Run in the Neon SQL editor to clear test data directly. Review each block and
-- run only what you want. IRREVERSIBLE — there is no undo. Studio roles live in
-- admin_roles / env and are NOT touched here.

-- 1) All order data (reservations, payments, two-axis state, follow-ups) --------
TRUNCATE follow_ups, order_state, payments, reservations RESTART IDENTITY;

-- 2) Inbox + marketing signups -------------------------------------------------
TRUNCATE contact_messages, waitlist_signups, marketing_unsubscribes RESTART IDENTITY;

-- 3) Customer accounts (keep studio members) -----------------------------------
-- Replace the emails below with your actual admin emails (must match what's in
-- admin_roles / ROOT_ADMIN_EMAIL / ADMIN_EMAILS). session/account/profile/
-- wishlist rows cascade automatically when a user is deleted.
--
-- First orphan any orders those customers placed back to guest orders:
--   UPDATE reservations SET user_id = NULL
--   WHERE user_id IN (SELECT "id" FROM "user"
--                     WHERE lower("email") NOT IN ('you@example.com'));
-- Then delete the customers:
--   DELETE FROM "user" WHERE lower("email") NOT IN ('you@example.com');
