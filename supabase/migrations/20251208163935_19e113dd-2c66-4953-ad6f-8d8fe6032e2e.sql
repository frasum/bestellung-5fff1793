-- Create a security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND email = 'frank.schumann@me.com'
  )
$$;

-- Policy for organizations: Super admins can view all demo organizations
CREATE POLICY "Super admins can view all demo organizations"
ON public.organizations
FOR SELECT
USING (
  is_demo = true 
  AND is_super_admin(auth.uid())
);

-- Policy for profiles: Super admins can view profiles of demo organizations
CREATE POLICY "Super admins can view demo org profiles"
ON public.profiles
FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM public.organizations WHERE is_demo = true
  )
  AND is_super_admin(auth.uid())
);