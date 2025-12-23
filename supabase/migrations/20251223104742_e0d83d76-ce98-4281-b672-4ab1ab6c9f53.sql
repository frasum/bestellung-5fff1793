-- =====================================================
-- Super-Admin RLS Policies für Organisations-Übersicht
-- =====================================================

-- Super admin kann alle Organisationen sehen (nicht nur Demo)
CREATE POLICY "Super admins can view all organizations"
ON public.organizations
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admin kann alle Profile sehen
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admin kann alle Profile aktualisieren (um Benutzer zu verschieben)
CREATE POLICY "Super admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (is_super_admin(auth.uid()));

-- Super admin kann alle Standorte sehen
CREATE POLICY "Super admins can view all locations"
ON public.locations
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admin kann alle Lieferanten sehen
CREATE POLICY "Super admins can view all suppliers"
ON public.suppliers
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admin kann alle User Roles sehen
CREATE POLICY "Super admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Super admin kann Organisationen löschen (für Bereinigung)
-- Policy bereits vorhanden, keine Aktion nötig

-- =====================================================
-- Datenbereinigung: Benutzer verschieben
-- =====================================================

-- Verschiebe restaurant@yum-thai.de zur Enterprise YUM Gastronomie GmbH
UPDATE public.profiles 
SET organization_id = '25ad4adc-d7c9-48cd-919a-4021c489f986'
WHERE id = '3771a85a-5f52-4146-abe9-b6c1f1d31897';

-- =====================================================
-- Datenbereinigung: Leere Organisationen löschen
-- =====================================================

-- Lösche "Pending Organization" Einträge
DELETE FROM public.organizations 
WHERE id IN (
  '7de93aee-fe2f-43a4-bf39-b74c2d59b70a',
  'cc0f4958-43b0-4d89-9ad7-3140d426526e'
);

-- Lösche leere "My Restaurant" ohne Benutzer
DELETE FROM public.organizations 
WHERE id = '6c682b09-d2ea-4550-a440-e103014f973d';

-- Lösche das Duplikat YUM Gastronomie GmbH (Free-Version, jetzt ohne Benutzer)
DELETE FROM public.organizations 
WHERE id = '1d01e079-d190-4861-9e4f-9d5471d3d44f';