-- Order lifecycle + marketing (Plan 1).
--
-- Adds a two-axis order state (Payment / Delivery) alongside the existing
-- reservations rows, keyed by order_ref exactly like the payments table. The
-- legacy reservations.status column is KEPT and maintained as a derived mirror
-- (see src/lib/order-status.ts) so customer-facing /account views and the
-- StatusBadge keep working unchanged.
--
-- Run this in Neon BEFORE the order-lifecycle branch serves traffic. The read
-- layer degrades gracefully (derives axes from reservations.status) if these
-- tables are missing, so a brief ordering gap won't crash the studio.

-- Two-axis order state ----------------------------------------------------------
--   payment_status  : pending -> submitted -> paid  (plus not_received)
--   delivery_status : not_delivered -> shipped -> delivered
--                     (only meaningful once payment_status = 'paid')
--   cancelled       : order-level override, independent of the two axes
--   confirmation_*  : the guarded, once-only "payment confirmed" customer email
CREATE TABLE IF NOT EXISTS order_state (
  order_ref             TEXT PRIMARY KEY,
  payment_status        TEXT NOT NULL DEFAULT 'pending'
                        CHECK (payment_status IN ('pending','submitted','paid','not_received')),
  delivery_status       TEXT NOT NULL DEFAULT 'not_delivered'
                        CHECK (delivery_status IN ('not_delivered','shipped','delivered')),
  cancelled             BOOLEAN NOT NULL DEFAULT false,
  confirmation_sent_at  TIMESTAMPTZ,          -- set once, only on a real send success
  confirmed_by          TEXT,                 -- admin email that sent the confirmation
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Manual per-order follow-up emails (repeatable, one row per send) ---------------
CREATE TABLE IF NOT EXISTS follow_ups (
  id         UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_ref  TEXT NOT NULL,
  template   TEXT NOT NULL,                   -- 'shipped' | 'thank_you' | 'custom'
  subject    TEXT,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_by    TEXT                             -- admin email that sent it
);
CREATE INDEX IF NOT EXISTS follow_ups_order_ref_idx ON follow_ups (order_ref);

-- Marketing consent: captured at /pay, opt-in (default false) --------------------
-- Stored on reservations so it travels with the order; the notify-list unions
-- consented buyers with waitlist_signups.
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT false;

-- Marketing unsubscribe flags (email is the key). A presence here excludes the
-- address from all future broadcasts. Transactional order emails ignore this.
CREATE TABLE IF NOT EXISTS marketing_unsubscribes (
  email           TEXT PRIMARY KEY,
  unsubscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill order_state from the current single status, one row per order_ref ----
--   delivered            -> paid + delivered
--   paid                 -> paid + not_delivered
--   payment_submitted    -> submitted
--   payment_not_received -> not_received
--   cancelled            -> cancelled flag (axes left at defaults)
--   pending / other      -> pending
INSERT INTO order_state (order_ref, payment_status, delivery_status, cancelled)
SELECT DISTINCT ON (order_ref)
  order_ref,
  CASE status
    WHEN 'payment_submitted'    THEN 'submitted'
    WHEN 'paid'                 THEN 'paid'
    WHEN 'delivered'            THEN 'paid'
    WHEN 'payment_not_received' THEN 'not_received'
    ELSE 'pending'
  END AS payment_status,
  CASE status WHEN 'delivered' THEN 'delivered' ELSE 'not_delivered' END AS delivery_status,
  (status = 'cancelled') AS cancelled
FROM reservations
WHERE order_ref IS NOT NULL
ORDER BY order_ref, created_at DESC
ON CONFLICT (order_ref) DO NOTHING;
