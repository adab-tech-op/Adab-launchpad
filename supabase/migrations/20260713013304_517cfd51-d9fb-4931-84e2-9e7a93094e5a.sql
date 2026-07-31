
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS notes text;

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
  AND size = ANY (ARRAY['S','M','L','XL','XXL'])
  AND quantity BETWEEN 1 AND 10
  AND (delivery_address IS NULL OR char_length(delivery_address) BETWEEN 3 AND 1000)
  AND (notes IS NULL OR char_length(notes) <= 1000)
);
