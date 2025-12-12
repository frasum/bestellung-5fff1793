-- Create packaging_units table
CREATE TABLE public.packaging_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Enable RLS
ALTER TABLE public.packaging_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view packaging_units in their organization" 
  ON public.packaging_units FOR SELECT 
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert packaging_units" 
  ON public.packaging_units FOR INSERT 
  WITH CHECK (
    organization_id = get_user_organization_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

CREATE POLICY "Admins and managers can update packaging_units" 
  ON public.packaging_units FOR UPDATE 
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  );

CREATE POLICY "Admins can delete packaging_units" 
  ON public.packaging_units FOR DELETE 
  USING (
    organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Create trigger for updated_at
CREATE TRIGGER update_packaging_units_updated_at
  BEFORE UPDATE ON public.packaging_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();