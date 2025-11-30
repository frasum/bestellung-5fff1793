-- Fix: Restrict orders UPDATE policy to order creators, admins, or managers only
-- Drop the existing permissive policy
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Create new restrictive policy that limits updates to:
-- 1. The order creator (user_id = auth.uid())
-- 2. Admins (has_role(auth.uid(), 'admin'))
-- 3. Managers (has_role(auth.uid(), 'manager'))
CREATE POLICY "Users can update their own orders" 
ON public.orders 
AS RESTRICTIVE
FOR UPDATE 
USING (
  (organization_id = get_user_organization_id(auth.uid())) AND 
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);