-- Rename packaging_units table to order_units
ALTER TABLE public.packaging_units RENAME TO order_units;

-- Update RLS policies to use new table name
-- First drop old policies
DROP POLICY IF EXISTS "Admins and managers can insert packaging_units" ON public.order_units;
DROP POLICY IF EXISTS "Admins and managers can update packaging_units" ON public.order_units;
DROP POLICY IF EXISTS "Admins can delete packaging_units" ON public.order_units;
DROP POLICY IF EXISTS "Users can view packaging_units in their organization" ON public.order_units;

-- Recreate policies with new names
CREATE POLICY "Admins and managers can insert order_units" 
ON public.order_units 
FOR INSERT 
WITH CHECK ((organization_id = get_user_organization_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

CREATE POLICY "Admins and managers can update order_units" 
ON public.order_units 
FOR UPDATE 
USING ((organization_id = get_user_organization_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role)));

CREATE POLICY "Admins can delete order_units" 
ON public.order_units 
FOR DELETE 
USING ((organization_id = get_user_organization_id(auth.uid())) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view order_units in their organization" 
ON public.order_units 
FOR SELECT 
USING (organization_id = get_user_organization_id(auth.uid()));