-- Extend magic link token validity from 24 hours to 7 days
ALTER TABLE public.supplier_portal_tokens 
ALTER COLUMN expires_at SET DEFAULT (now() + interval '7 days');