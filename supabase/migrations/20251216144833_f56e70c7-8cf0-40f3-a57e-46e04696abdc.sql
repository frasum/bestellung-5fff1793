-- Add upgrade tracking columns to supplier_b2b_customers
ALTER TABLE supplier_b2b_customers 
ADD COLUMN IF NOT EXISTS upgraded_organization_id uuid REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS upgraded_at timestamp with time zone;

-- Add source tracking to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS source_b2b_customer_id uuid REFERENCES supplier_b2b_customers(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_supplier_b2b_customers_upgraded ON supplier_b2b_customers(upgraded_organization_id) WHERE upgraded_organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_organizations_source_type ON organizations(source_type) WHERE source_type = 'b2b_upgrade';