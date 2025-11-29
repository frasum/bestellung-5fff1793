-- Update orders policies
DROP POLICY IF EXISTS "Users can view orders in their organization" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders in their organization" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

CREATE POLICY "Users can view orders in their organization"
ON public.orders FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert orders in their organization"
ON public.orders FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND user_id = auth.uid()
);

CREATE POLICY "Users can update their own orders"
ON public.orders FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Update order_items policies
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

CREATE POLICY "Users can view order items for their orders"
ON public.order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE organization_id = public.get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Users can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id FROM orders 
    WHERE organization_id = public.get_user_organization_id(auth.uid())
  )
);

-- Update delivery_addresses policies
DROP POLICY IF EXISTS "Users can view addresses in their organization" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Admins and managers can insert addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Admins and managers can update addresses" ON public.delivery_addresses;
DROP POLICY IF EXISTS "Admins can delete addresses" ON public.delivery_addresses;

CREATE POLICY "Users can view addresses in their organization"
ON public.delivery_addresses FOR SELECT
USING (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert addresses"
ON public.delivery_addresses FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update addresses"
ON public.delivery_addresses FOR UPDATE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete addresses"
ON public.delivery_addresses FOR DELETE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- Update organizations policies
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;

CREATE POLICY "Users can view their own organization"
ON public.organizations FOR SELECT
USING (id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can update their organization"
ON public.organizations FOR UPDATE
USING (
  id = public.get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

-- Update team_invitations policies
DROP POLICY IF EXISTS "Admins can view invitations in their organization" ON public.team_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON public.team_invitations;

CREATE POLICY "Admins can view invitations in their organization"
ON public.team_invitations FOR SELECT
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can create invitations"
ON public.team_invitations FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
  AND invited_by = auth.uid()
);

CREATE POLICY "Admins can delete invitations"
ON public.team_invitations FOR DELETE
USING (
  organization_id = public.get_user_organization_id(auth.uid())
  AND has_role(auth.uid(), 'admin')
);