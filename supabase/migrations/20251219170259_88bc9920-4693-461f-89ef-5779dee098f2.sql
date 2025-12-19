-- Add supplier_id column to b2b_supplier_vendors table
ALTER TABLE public.b2b_supplier_vendors
ADD COLUMN supplier_id uuid REFERENCES public.b2b_suppliers(id) ON DELETE SET NULL;

-- Add supplier_id column to b2b_inventory_sessions table  
ALTER TABLE public.b2b_inventory_sessions
ADD COLUMN supplier_id uuid REFERENCES public.b2b_suppliers(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_b2b_supplier_vendors_supplier_id ON public.b2b_supplier_vendors(supplier_id);
CREATE INDEX idx_b2b_inventory_sessions_supplier_id ON public.b2b_inventory_sessions(supplier_id);