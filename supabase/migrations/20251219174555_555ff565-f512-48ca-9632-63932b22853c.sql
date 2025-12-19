-- Create table for B2B mobile access tokens
CREATE TABLE public.b2b_mobile_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  account_id UUID NOT NULL REFERENCES supplier_b2b_accounts(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES b2b_suppliers(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.b2b_mobile_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Supplier owners can manage their mobile tokens"
ON public.b2b_mobile_tokens
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), account_id));

CREATE POLICY "Service role can manage all mobile tokens"
ON public.b2b_mobile_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for faster token lookups
CREATE INDEX idx_b2b_mobile_tokens_token ON public.b2b_mobile_tokens(token);
CREATE INDEX idx_b2b_mobile_tokens_account_id ON public.b2b_mobile_tokens(account_id);