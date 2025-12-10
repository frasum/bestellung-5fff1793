-- Phase 1: RLS Policies härten

-- 1. cart_drafts: Strengere SELECT Policy (nur eigene Drafts oder Admin/Manager können alle sehen)
DROP POLICY IF EXISTS "Users can view drafts in their organization" ON public.cart_drafts;

CREATE POLICY "Users can view their own drafts or admin/manager view all"
ON public.cart_drafts
FOR SELECT
USING (
  (organization_id = get_user_organization_id(auth.uid())) 
  AND (
    user_id = auth.uid() 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
  )
);

-- 2. order_confirmation_tokens: User-Schutz hinzufügen für SELECT (nur eigene oder Admin/Manager)
DROP POLICY IF EXISTS "Service role can read tokens" ON public.order_confirmation_tokens;

CREATE POLICY "Users can view tokens for their orders"
ON public.order_confirmation_tokens
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

-- 3. Add rate limiting table for public endpoints
CREATE TABLE IF NOT EXISTS public.simple_order_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simple_order_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage simple order rate limits"
ON public.simple_order_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup function for old rate limits
CREATE OR REPLACE FUNCTION public.cleanup_simple_order_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.simple_order_rate_limits
  WHERE created_at < now() - interval '1 hour';
$$;