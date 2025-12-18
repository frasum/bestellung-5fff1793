-- Add SELECT policy for supplier owners to view their own account
CREATE POLICY "Supplier owners can view their own account"
ON public.supplier_b2b_accounts
FOR SELECT
USING (is_b2b_supplier_owner(auth.uid(), id));