-- Create b2b_suppliers table for multi-supplier support
CREATE TABLE public.b2b_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  logo_url text,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add supplier_id to supplier_b2b_articles
ALTER TABLE public.supplier_b2b_articles 
ADD COLUMN supplier_id uuid REFERENCES public.b2b_suppliers(id) ON DELETE SET NULL;

-- Enable RLS on b2b_suppliers
ALTER TABLE public.b2b_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for b2b_suppliers
CREATE POLICY "Supplier owners can manage their suppliers"
ON public.b2b_suppliers
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), account_id));

CREATE POLICY "Customers can view suppliers of their account"
ON public.b2b_suppliers
FOR SELECT
USING (account_id IN (
  SELECT supplier_account_id FROM supplier_b2b_customers WHERE user_id = auth.uid()
));

-- Create default suppliers for existing accounts and migrate articles
DO $$
DECLARE
  acc RECORD;
  new_supplier_id uuid;
BEGIN
  FOR acc IN SELECT id, company_name FROM supplier_b2b_accounts LOOP
    -- Create default supplier for each account
    INSERT INTO b2b_suppliers (account_id, name, sort_order)
    VALUES (acc.id, acc.company_name, 0)
    RETURNING id INTO new_supplier_id;
    
    -- Assign all existing articles to the default supplier
    UPDATE supplier_b2b_articles 
    SET supplier_id = new_supplier_id 
    WHERE supplier_account_id = acc.id AND supplier_id IS NULL;
  END LOOP;
END $$;

-- Create trigger for updated_at
CREATE TRIGGER update_b2b_suppliers_updated_at
BEFORE UPDATE ON public.b2b_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();