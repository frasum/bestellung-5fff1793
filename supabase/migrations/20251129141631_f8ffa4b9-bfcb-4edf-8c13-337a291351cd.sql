-- Drop the problematic policy on profiles
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (id = auth.uid());

-- Users can view other profiles in same org (via a function to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = user_id;
$$;

-- Policy using the function to avoid recursion
CREATE POLICY "Users can view profiles in same organization"
ON public.profiles
FOR SELECT
USING (
  organization_id = public.get_user_organization_id(auth.uid())
);