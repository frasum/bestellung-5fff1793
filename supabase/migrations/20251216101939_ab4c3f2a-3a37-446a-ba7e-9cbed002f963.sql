-- Create junction table for customer-supplier access
CREATE TABLE public.b2b_customer_supplier_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES supplier_b2b_customers(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES b2b_suppliers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, supplier_id)
);

-- Enable RLS
ALTER TABLE public.b2b_customer_supplier_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Supplier owners can manage customer access"
ON public.b2b_customer_supplier_access
FOR ALL
USING (
  supplier_id IN (
    SELECT id FROM b2b_suppliers WHERE is_b2b_supplier_owner(auth.uid(), account_id)
  )
);

CREATE POLICY "Customers can view their own access"
ON public.b2b_customer_supplier_access
FOR SELECT
USING (
  customer_id = get_b2b_customer_id(auth.uid())
);

-- Migrate existing customers: grant access to ALL suppliers of their account
INSERT INTO public.b2b_customer_supplier_access (customer_id, supplier_id)
SELECT c.id, s.id
FROM supplier_b2b_customers c
JOIN b2b_suppliers s ON s.account_id = c.supplier_account_id
WHERE s.is_active = true;