-- Add advanced_view_enabled column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN advanced_view_enabled BOOLEAN DEFAULT false NOT NULL;