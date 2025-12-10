-- Alte Policy löschen und neu erstellen mit korrekter USING + WITH CHECK Kombination
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON public.profiles;

-- Neue Policy: Admins können Profile in ihrer Organisation aktualisieren
-- USING: Prüft ob das zu aktualisierende Profil in der gleichen Organisation ist
-- WITH CHECK: Erlaubt auch das Setzen von organization_id auf null (Entfernen)
CREATE POLICY "Admins can update profiles in their organization"
ON public.profiles
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND (
    organization_id IS NULL 
    OR organization_id = get_user_organization_id(auth.uid())
  )
);