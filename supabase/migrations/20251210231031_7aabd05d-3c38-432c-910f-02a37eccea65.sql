-- Erlaubt Admins, Profile in ihrer Organisation zu aktualisieren (z.B. zum Entfernen von Mitgliedern)
CREATE POLICY "Admins can update profiles in their organization"
ON public.profiles
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);