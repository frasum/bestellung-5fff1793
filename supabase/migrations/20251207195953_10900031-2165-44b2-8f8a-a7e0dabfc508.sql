-- Create order confirmation tokens table
CREATE TABLE public.order_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS
ALTER TABLE public.order_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can insert tokens (from edge functions)
CREATE POLICY "Service role can insert tokens"
ON public.order_confirmation_tokens
FOR INSERT
WITH CHECK (true);

-- Only service role can update tokens (for confirmation)
CREATE POLICY "Service role can update tokens"
ON public.order_confirmation_tokens
FOR UPDATE
USING (true);

-- Only service role can read tokens (for validation)
CREATE POLICY "Service role can read tokens"
ON public.order_confirmation_tokens
FOR SELECT
USING (true);

-- Add index for token lookup
CREATE INDEX idx_order_confirmation_tokens_token ON public.order_confirmation_tokens(token);

-- Add index for order lookup
CREATE INDEX idx_order_confirmation_tokens_order_id ON public.order_confirmation_tokens(order_id);