-- Create translation_overrides table for storing custom translations per organization
CREATE TABLE public.translation_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  translation_key TEXT NOT NULL,
  original_value TEXT,
  override_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  
  UNIQUE(organization_id, language_code, translation_key)
);

-- Enable RLS
ALTER TABLE public.translation_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view translation overrides in their organization"
  ON public.translation_overrides FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can insert translation overrides"
  ON public.translation_overrides FOR INSERT
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update translation overrides"
  ON public.translation_overrides FOR UPDATE
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete translation overrides"
  ON public.translation_overrides FOR DELETE
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Updated_at Trigger
CREATE TRIGGER update_translation_overrides_updated_at
  BEFORE UPDATE ON public.translation_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();