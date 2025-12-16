-- Add supplier_id directly to supplier_b2b_customers
ALTER TABLE supplier_b2b_customers 
ADD COLUMN supplier_id uuid REFERENCES b2b_suppliers(id) ON DELETE SET NULL;

-- Migrate existing customers: assign supplier_id from b2b_customer_supplier_access
UPDATE supplier_b2b_customers c
SET supplier_id = (
  SELECT supplier_id 
  FROM b2b_customer_supplier_access csa 
  WHERE csa.customer_id = c.id 
  LIMIT 1
);

-- If no access entry exists, assign first supplier of the account
UPDATE supplier_b2b_customers c
SET supplier_id = (
  SELECT id 
  FROM b2b_suppliers s 
  WHERE s.account_id = c.supplier_account_id 
  AND s.is_active = true
  ORDER BY sort_order, created_at
  LIMIT 1
)
WHERE c.supplier_id IS NULL;

-- Add index for efficient filtering
CREATE INDEX idx_supplier_b2b_customers_supplier_id ON supplier_b2b_customers(supplier_id);