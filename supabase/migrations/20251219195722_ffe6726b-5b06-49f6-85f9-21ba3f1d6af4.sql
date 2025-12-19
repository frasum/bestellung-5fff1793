-- Add sponsored columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_sponsored boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsored_note text;

-- Update RLS policy to allow super admins to update is_sponsored
DROP POLICY IF EXISTS "Super admins can update sponsored status" ON public.organizations;
CREATE POLICY "Super admins can update sponsored status" 
ON public.organizations 
FOR UPDATE 
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));