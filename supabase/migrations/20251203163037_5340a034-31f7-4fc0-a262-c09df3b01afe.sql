-- Remove insecure public access policies from supplier_portal_tokens
DROP POLICY IF EXISTS "Anyone can read valid tokens for verification" ON public.supplier_portal_tokens;
DROP POLICY IF EXISTS "Anyone can update tokens" ON public.supplier_portal_tokens;

-- Add secure policy: Only service role (Edge Functions) can read/update tokens
-- Service role bypasses RLS, so no explicit policy needed for Edge Functions
-- But we need a SELECT policy for admins to see tokens they created (for debugging)
CREATE POLICY "Admins can view tokens for their suppliers"
ON public.supplier_portal_tokens
FOR SELECT
USING (
  supplier_id IN (
    SELECT id FROM suppliers 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND has_role(auth.uid(), 'admin')
);