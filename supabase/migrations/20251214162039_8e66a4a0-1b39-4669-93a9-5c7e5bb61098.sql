-- Create wine catalog tokens table
CREATE TABLE public.wine_catalog_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  pin_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wine_catalog_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage tokens
CREATE POLICY "Admins can view wine catalog tokens"
ON public.wine_catalog_tokens
FOR SELECT
USING (
  (organization_id = get_user_organization_id(auth.uid())) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can insert wine catalog tokens"
ON public.wine_catalog_tokens
FOR INSERT
WITH CHECK (
  (organization_id = get_user_organization_id(auth.uid())) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update wine catalog tokens"
ON public.wine_catalog_tokens
FOR UPDATE
USING (
  (organization_id = get_user_organization_id(auth.uid())) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete wine catalog tokens"
ON public.wine_catalog_tokens
FOR DELETE
USING (
  (organization_id = get_user_organization_id(auth.uid())) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Service role can read tokens for verification
CREATE POLICY "Service role can read wine catalog tokens"
ON public.wine_catalog_tokens
FOR SELECT
USING (true);

-- Create rate limits table for PIN verification
CREATE TABLE public.wine_token_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wine_token_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage wine token rate limits"
ON public.wine_token_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup function for rate limits
CREATE OR REPLACE FUNCTION public.cleanup_wine_token_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.wine_token_rate_limits
  WHERE created_at < now() - interval '15 minutes';
$$;