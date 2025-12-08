-- Add demo columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;