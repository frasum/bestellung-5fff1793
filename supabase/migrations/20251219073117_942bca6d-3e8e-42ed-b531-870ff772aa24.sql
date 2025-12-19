-- Add is_active column to supplier_portal_tokens for soft-delete/revoke functionality
ALTER TABLE public.supplier_portal_tokens 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update verify-supplier-token to also check is_active
COMMENT ON COLUMN public.supplier_portal_tokens.is_active IS 'Token can be revoked by setting this to false';