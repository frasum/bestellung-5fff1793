-- Add test mode columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN test_mode_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN test_email TEXT DEFAULT NULL;