-- Update suppliers policies to use the function
DROP POLICY IF EXISTS "Users can view suppliers in their organization" ON public.suppliers;
DROP POLICY IF EXISTS "Admins and managers can insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins and managers can update suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON public.suppliers;

CREATE POLICY "Users can view suppliers in their organization"
ON public.suppliers FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update suppliers"
ON public.suppliers FOR UPDATE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete suppliers"
ON public.suppliers FOR DELETE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- Update articles policies
DROP POLICY IF EXISTS "Users can view articles in their organization" ON public.articles;
DROP POLICY IF EXISTS "Admins and managers can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Admins and managers can update articles" ON public.articles;
DROP POLICY IF EXISTS "Admins can delete articles" ON public.articles;

CREATE POLICY "Users can view articles in their organization"
ON public.articles FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert articles"
ON public.articles FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update articles"
ON public.articles FOR UPDATE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete articles"
ON public.articles FOR DELETE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);