-- Create locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_code TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supplier_locations junction table for location-specific supplier data
CREATE TABLE public.supplier_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  customer_number TEXT,
  minimum_order_value NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, location_id)
);

-- Add location_id to delivery_addresses
ALTER TABLE public.delivery_addresses 
ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add location_id to orders
ALTER TABLE public.orders 
ADD COLUMN location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for locations
CREATE POLICY "Users can view locations in their organization"
ON public.locations FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert locations"
ON public.locations FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update locations"
ON public.locations FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete locations"
ON public.locations FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);

-- RLS policies for supplier_locations
CREATE POLICY "Users can view supplier_locations in their organization"
ON public.supplier_locations FOR SELECT
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Admins and managers can insert supplier_locations"
ON public.supplier_locations FOR INSERT
WITH CHECK (
  supplier_id IN (
    SELECT id FROM public.suppliers 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update supplier_locations"
ON public.supplier_locations FOR UPDATE
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete supplier_locations"
ON public.supplier_locations FOR DELETE
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND has_role(auth.uid(), 'admin')
);

-- Create updated_at triggers
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_locations_updated_at
BEFORE UPDATE ON public.supplier_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing data: Create default location for each organization
INSERT INTO public.locations (organization_id, name, short_code, is_default)
SELECT id, name, 'HQ', true
FROM public.organizations;

-- Migrate existing customer_numbers from suppliers to supplier_locations
INSERT INTO public.supplier_locations (supplier_id, location_id, customer_number, minimum_order_value, is_active)
SELECT 
  s.id,
  l.id,
  s.customer_number,
  s.minimum_order_value,
  s.is_active
FROM public.suppliers s
JOIN public.locations l ON l.organization_id = s.organization_id AND l.is_default = true;

-- Assign existing delivery_addresses to default location
UPDATE public.delivery_addresses da
SET location_id = l.id
FROM public.locations l
WHERE l.organization_id = da.organization_id AND l.is_default = true;

-- Assign existing orders to default location
UPDATE public.orders o
SET location_id = l.id
FROM public.locations l
WHERE l.organization_id = o.organization_id AND l.is_default = true;