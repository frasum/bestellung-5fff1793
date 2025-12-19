-- UPDATE Policy: Admins können Tokens ihrer Lieferanten aktualisieren
CREATE POLICY "Admins can update tokens for their suppliers"
  ON public.supplier_portal_tokens
  FOR UPDATE
  TO authenticated
  USING (
    (supplier_id IN (
      SELECT suppliers.id FROM suppliers 
      WHERE suppliers.organization_id = get_user_organization_id(auth.uid())
    )) AND has_role(auth.uid(), 'admin'::app_role)
  );

-- DELETE Policy: Admins können Tokens ihrer Lieferanten löschen
CREATE POLICY "Admins can delete tokens for their suppliers"
  ON public.supplier_portal_tokens
  FOR DELETE
  TO authenticated
  USING (
    (supplier_id IN (
      SELECT suppliers.id FROM suppliers 
      WHERE suppliers.organization_id = get_user_organization_id(auth.uid())
    )) AND has_role(auth.uid(), 'admin'::app_role)
  );