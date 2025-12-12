-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Create new permissive policy (PERMISSIVE is the default)
CREATE POLICY "Users can update their own orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  (organization_id = get_user_organization_id(auth.uid())) 
  AND (
    (user_id = auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
  )
);