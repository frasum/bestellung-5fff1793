-- Create table for supplier portal magic link tokens
CREATE TABLE public.supplier_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_portal_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and managers can create tokens for suppliers in their organization
CREATE POLICY "Admins and managers can insert tokens"
ON public.supplier_portal_tokens
FOR INSERT
WITH CHECK (
  supplier_id IN (
    SELECT id FROM public.suppliers 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Policy: Allow reading tokens for verification (public for magic link validation)
CREATE POLICY "Anyone can read valid tokens for verification"
ON public.supplier_portal_tokens
FOR SELECT
USING (true);

-- Policy: Allow updating tokens (marking as used)
CREATE POLICY "Anyone can update tokens"
ON public.supplier_portal_tokens
FOR UPDATE
USING (true);

-- Create index for faster token lookups
CREATE INDEX idx_supplier_portal_tokens_token ON public.supplier_portal_tokens(token);
CREATE INDEX idx_supplier_portal_tokens_supplier_id ON public.supplier_portal_tokens(supplier_id);