-- Add contact information columns to organizations table for PDF export
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS address TEXT;