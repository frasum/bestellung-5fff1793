-- Create employee_locations junction table for Many-to-Many relationship
CREATE TABLE public.employee_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, location_id)
);

-- Enable RLS
ALTER TABLE public.employee_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view employee_locations in their organization"
ON public.employee_locations
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Admins can insert employee_locations"
ON public.employee_locations
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE organization_id = get_user_organization_id(auth.uid())
  ) AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete employee_locations"
ON public.employee_locations
FOR DELETE
USING (
  employee_id IN (
    SELECT id FROM public.employees 
    WHERE organization_id = get_user_organization_id(auth.uid())
  ) AND has_role(auth.uid(), 'admin'::app_role)
);

-- Index for faster lookups
CREATE INDEX idx_employee_locations_employee_id ON public.employee_locations(employee_id);
CREATE INDEX idx_employee_locations_location_id ON public.employee_locations(location_id);