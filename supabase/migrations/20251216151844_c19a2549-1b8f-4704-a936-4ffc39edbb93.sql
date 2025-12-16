-- Add upgrade tracking columns to supplier_b2b_accounts
ALTER TABLE supplier_b2b_accounts 
ADD COLUMN IF NOT EXISTS upgraded_organization_id uuid REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS upgraded_at timestamp with time zone;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_supplier_b2b_accounts_upgraded_org 
ON supplier_b2b_accounts(upgraded_organization_id) WHERE upgraded_organization_id IS NOT NULL;