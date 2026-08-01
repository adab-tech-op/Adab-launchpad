-- Manual bKash payment records — a bridge until the bKash merchant gateway is approved.
-- One payment submission per order (keyed by order_ref). trx_id is UNIQUE so a single
-- transaction can't be claimed for two orders or silently resubmitted.
CREATE TABLE IF NOT EXISTS payments (
  order_ref     TEXT PRIMARY KEY,
  bkash_number  TEXT NOT NULL,   -- the number the customer paid FROM
  trx_id        TEXT NOT NULL UNIQUE,
  amount        INTEGER,         -- expected amount snapshot (BDT)
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Expand the reservation status lifecycle for the manual-verify flow:
--   pending -> payment_submitted -> paid | payment_not_received -> delivered (or cancelled)
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending','payment_submitted','paid','payment_not_received','delivered','cancelled'));
