-- Create supplier_portal_settings table for customizable portal texts
CREATE TABLE public.supplier_portal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  portal_title TEXT NOT NULL DEFAULT 'Lieferantenportal',
  welcome_message TEXT,
  card_title TEXT NOT NULL DEFAULT 'Meine Artikel',
  card_description TEXT NOT NULL DEFAULT 'Änderungen werden zur Genehmigung eingereicht.',
  info_text TEXT,
  footer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.supplier_portal_settings ENABLE ROW LEVEL SECURITY;

-- Admins and managers can manage settings
CREATE POLICY "Admins and managers can insert portal settings"
ON public.supplier_portal_settings
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update portal settings"
ON public.supplier_portal_settings
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Users can view portal settings in their organization"
ON public.supplier_portal_settings
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can delete portal settings"
ON public.supplier_portal_settings
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Service role can read settings (for edge function)
CREATE POLICY "Service role can read portal settings"
ON public.supplier_portal_settings
FOR SELECT
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_supplier_portal_settings_updated_at
BEFORE UPDATE ON public.supplier_portal_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();