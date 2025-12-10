-- Create employee_location_suppliers table for fine-grained authorization
CREATE TABLE public.employee_location_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, location_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.employee_location_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view employee_location_suppliers in their organization"
ON public.employee_location_suppliers
FOR SELECT
USING (
  employee_id IN (
    SELECT id FROM public.employees
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Admins can insert employee_location_suppliers"
ON public.employee_location_suppliers
FOR INSERT
WITH CHECK (
  employee_id IN (
    SELECT id FROM public.employees
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete employee_location_suppliers"
ON public.employee_location_suppliers
FOR DELETE
USING (
  employee_id IN (
    SELECT id FROM public.employees
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Index for performance
CREATE INDEX idx_employee_location_suppliers_employee_id ON public.employee_location_suppliers(employee_id);
CREATE INDEX idx_employee_location_suppliers_location_id ON public.employee_location_suppliers(location_id);
CREATE INDEX idx_employee_location_suppliers_supplier_id ON public.employee_location_suppliers(supplier_id);