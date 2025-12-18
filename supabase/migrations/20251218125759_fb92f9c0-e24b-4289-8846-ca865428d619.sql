-- Super-Admins können alle B2B-Daten lesen
CREATE POLICY "Super admins can view all B2B accounts"
ON public.supplier_b2b_accounts FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all B2B suppliers"
ON public.b2b_suppliers FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can view all B2B supplier users"
ON public.b2b_supplier_users FOR SELECT
USING (is_super_admin(auth.uid()));