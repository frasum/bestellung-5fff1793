-- Erstelle eine Security Definer Funktion zum Entfernen von Team-Mitgliedern
-- Diese umgeht RLS und führt eigene Sicherheitsprüfungen durch
CREATE OR REPLACE FUNCTION public.remove_team_member(member_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_org_id uuid;
  member_org_id uuid;
BEGIN
  -- Hole die Organisation des aufrufenden Users
  SELECT organization_id INTO caller_org_id 
  FROM profiles WHERE id = auth.uid();
  
  -- Hole die Organisation des zu entfernenden Members
  SELECT organization_id INTO member_org_id 
  FROM profiles WHERE id = member_user_id;
  
  -- Sicherheitsprüfungen
  IF caller_org_id IS NULL THEN
    RAISE EXCEPTION 'Caller has no organization';
  END IF;
  
  IF member_org_id IS NULL OR member_org_id != caller_org_id THEN
    RAISE EXCEPTION 'Member is not in your organization';
  END IF;
  
  -- Prüfe ob Caller Admin ist
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can remove team members';
  END IF;
  
  -- Verhindere Selbst-Löschung
  IF member_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot remove yourself from the organization';
  END IF;
  
  -- Entferne den Member aus der Organisation
  UPDATE profiles SET organization_id = NULL WHERE id = member_user_id;
END;
$$;