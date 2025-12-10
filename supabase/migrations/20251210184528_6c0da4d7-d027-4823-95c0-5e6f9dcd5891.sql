-- Add is_multi_supplier column to simple_order_tokens
ALTER TABLE simple_order_tokens 
ADD COLUMN is_multi_supplier BOOLEAN NOT NULL DEFAULT false;

-- Make supplier_id nullable for multi-supplier tokens
ALTER TABLE simple_order_tokens 
ALTER COLUMN supplier_id DROP NOT NULL;

-- Create junction table for multi-supplier tokens
CREATE TABLE simple_order_token_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES simple_order_tokens(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(token_id, supplier_id)
);

-- Enable RLS
ALTER TABLE simple_order_token_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for simple_order_token_suppliers
CREATE POLICY "Admins can view token suppliers"
ON simple_order_token_suppliers FOR SELECT
USING (
  token_id IN (
    SELECT id FROM simple_order_tokens 
    WHERE organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can insert token suppliers"
ON simple_order_token_suppliers FOR INSERT
WITH CHECK (
  token_id IN (
    SELECT id FROM simple_order_tokens 
    WHERE organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can delete token suppliers"
ON simple_order_token_suppliers FOR DELETE
USING (
  token_id IN (
    SELECT id FROM simple_order_tokens 
    WHERE organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Service role can read token suppliers"
ON simple_order_token_suppliers FOR SELECT
USING (true);

-- Add index for performance
CREATE INDEX idx_token_suppliers_token_id ON simple_order_token_suppliers(token_id);
CREATE INDEX idx_token_suppliers_supplier_id ON simple_order_token_suppliers(supplier_id);