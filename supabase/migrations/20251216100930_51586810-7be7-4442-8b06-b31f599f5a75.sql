-- Add supplier_id to supplier_b2b_orders
ALTER TABLE public.supplier_b2b_orders 
ADD COLUMN supplier_id uuid REFERENCES public.b2b_suppliers(id) ON DELETE SET NULL;

-- Add supplier_id to supplier_b2b_offers
ALTER TABLE public.supplier_b2b_offers 
ADD COLUMN supplier_id uuid REFERENCES public.b2b_suppliers(id) ON DELETE SET NULL;

-- Migrate existing orders to default supplier per account
DO $$
DECLARE
  acc RECORD;
  default_supplier_id uuid;
BEGIN
  FOR acc IN SELECT id FROM supplier_b2b_accounts LOOP
    -- Get the first (default) supplier for this account
    SELECT id INTO default_supplier_id 
    FROM b2b_suppliers 
    WHERE account_id = acc.id 
    ORDER BY sort_order ASC 
    LIMIT 1;
    
    IF default_supplier_id IS NOT NULL THEN
      -- Update orders
      UPDATE supplier_b2b_orders 
      SET supplier_id = default_supplier_id 
      WHERE supplier_account_id = acc.id AND supplier_id IS NULL;
      
      -- Update offers
      UPDATE supplier_b2b_offers 
      SET supplier_id = default_supplier_id 
      WHERE supplier_account_id = acc.id AND supplier_id IS NULL;
    END IF;
  END LOOP;
END $$;