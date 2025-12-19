-- First add owner_user_id column to supplier_b2b_accounts
ALTER TABLE public.supplier_b2b_accounts 
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id);

-- Update the owner_user_id for Kao account based on the user we created
UPDATE public.supplier_b2b_accounts
SET owner_user_id = u.id
FROM auth.users u
WHERE lower(u.email) = lower(supplier_b2b_accounts.email)
AND supplier_b2b_accounts.owner_user_id IS NULL;

-- Update is_b2b_supplier_owner function to also check for direct account owners
CREATE OR REPLACE FUNCTION public.is_b2b_supplier_owner(p_user_id UUID, p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    -- New logic: Direct account owner via owner_user_id
    SELECT 1 FROM supplier_b2b_accounts sba
    WHERE sba.id = p_account_id AND sba.owner_user_id = p_user_id
  )
  OR EXISTS (
    -- New logic: Direct account owner via email match
    SELECT 1 FROM supplier_b2b_accounts sba
    JOIN auth.users u ON lower(u.email) = lower(sba.email)
    WHERE sba.id = p_account_id AND u.id = p_user_id
  )
  OR EXISTS (
    -- Legacy logic: Via linked_supplier_id and organization
    SELECT 1 FROM supplier_b2b_accounts sba
    JOIN suppliers s ON s.id = sba.linked_supplier_id
    JOIN profiles p ON p.organization_id = s.organization_id
    WHERE sba.id = p_account_id AND p.id = p_user_id
  )
$$;