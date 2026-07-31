
DROP POLICY "Anyone can join waitlist" ON public.waitlist_signups;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_signups
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(email) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (phone IS NULL OR char_length(phone) BETWEEN 3 AND 40)
);
