-- Update handle_new_user trigger to create default location for new organizations
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_org_id UUID;
  org_name TEXT;
BEGIN
  -- Get organization name
  org_name := COALESCE(new.raw_user_meta_data->>'organization_name', 'My Restaurant');
  
  -- Create a new organization for the user
  INSERT INTO public.organizations (name)
  VALUES (org_name)
  RETURNING id INTO new_org_id;

  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, organization_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new_org_id
  );

  -- Assign admin role to new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'admin');

  -- Create default location for the organization
  INSERT INTO public.locations (organization_id, name, short_code, is_default)
  VALUES (new_org_id, org_name, 'HQ', true);

  RETURN new;
END;
$function$;

-- Set TSB location as default
UPDATE locations 
SET is_default = true 
WHERE id = 'e5bb4336-ab63-44c8-860c-e701c220f6ab';