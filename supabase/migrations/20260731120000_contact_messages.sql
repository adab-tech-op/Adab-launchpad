-- Contact form submissions.
-- Mirrors the waitlist_signups / reservations pattern: public (anon) INSERT only,
-- guarded by an RLS CHECK. No SELECT for anon/authenticated — messages are read
-- via the service role (Supabase Studio, or a future /studio admin view).

CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  order_number TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a contact message"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  char_length(name) BETWEEN 1 AND 120
  AND char_length(email) BETWEEN 3 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (order_number IS NULL OR char_length(order_number) BETWEEN 1 AND 60)
  AND char_length(message) BETWEEN 1 AND 4000
);
