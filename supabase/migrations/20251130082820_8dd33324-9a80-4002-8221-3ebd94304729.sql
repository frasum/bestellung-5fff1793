-- Create email_templates table for customizable email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL DEFAULT 'order',
  subject_template TEXT NOT NULL DEFAULT 'Neue Bestellung von {restaurant_name}{customer_number_suffix}',
  greeting TEXT NOT NULL DEFAULT 'Guten Tag,',
  introduction TEXT NOT NULL DEFAULT 'hiermit senden wir Ihnen unsere Bestellung:',
  closing TEXT NOT NULL DEFAULT 'Vielen Dank für Ihre Zusammenarbeit.',
  signature TEXT NOT NULL DEFAULT 'Mit freundlichen Grüßen,\n{restaurant_name}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, template_type)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view email templates in their organization"
ON public.email_templates FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert email templates"
ON public.email_templates FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update email templates"
ON public.email_templates FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete email templates"
ON public.email_templates FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();