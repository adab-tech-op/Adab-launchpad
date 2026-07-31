-- Turn reservations into trackable orders.
--   order_ref : shared across all line items from one checkout (e.g. "ADAB-7QK2P9")
--   status    : lifecycle, defaults to 'pending'; only staff (service_role, which
--               bypasses RLS) can advance it. Anon inserts may only create 'pending'.
-- Lifecycle: pending -> confirmed -> paid -> shipped -> delivered  (or cancelled)

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS order_ref TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS reservations_order_ref_idx ON public.reservations (order_ref);

ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending','confirmed','paid','shipped','delivered','cancelled'));

-- Recreate the anon INSERT policy to cover every column, including the new ones.
DROP POLICY IF EXISTS "Anyone can reserve" ON public.reservations;
CREATE POLICY "Anyone can reserve"
ON public.reservations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 120
  AND char_length(email) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND char_length(phone) BETWEEN 3 AND 40
  AND char_length(product_slug) BETWEEN 1 AND 120
  AND size IN ('S','M','L','XL','XXL')
  AND quantity BETWEEN 1 AND 10
  AND (delivery_address IS NULL OR char_length(delivery_address) BETWEEN 1 AND 1000)
  AND (notes IS NULL OR char_length(notes) BETWEEN 1 AND 1000)
  AND (order_ref IS NULL OR order_ref ~ '^ADAB-[A-Z0-9]{6}$')
  AND status = 'pending'
);
