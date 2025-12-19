-- Add price_edit_expires_at column to supplier_portal_tokens
-- This defines when the price editing permission expires (default: 7 days after token creation)
ALTER TABLE public.supplier_portal_tokens 
ADD COLUMN price_edit_expires_at TIMESTAMPTZ DEFAULT (now() + '7 days'::interval);

-- Update existing tokens: set price_edit_expires_at based on created_at + 7 days
UPDATE public.supplier_portal_tokens 
SET price_edit_expires_at = created_at + INTERVAL '7 days'
WHERE price_edit_expires_at IS NULL;