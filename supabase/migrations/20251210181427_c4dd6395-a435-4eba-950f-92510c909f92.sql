-- Create table for simple order tokens (Kiosk mode)
CREATE TABLE public.simple_order_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'th',
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.simple_order_tokens ENABLE ROW LEVEL SECURITY;

-- Admins can manage tokens in their organization
CREATE POLICY "Admins can view simple order tokens"
ON public.simple_order_tokens
FOR SELECT
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can insert simple order tokens"
ON public.simple_order_tokens
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update simple order tokens"
ON public.simple_order_tokens
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete simple order tokens"
ON public.simple_order_tokens
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Service role can read tokens (for Edge Functions)
CREATE POLICY "Service role can read simple order tokens"
ON public.simple_order_tokens
FOR SELECT
USING (true);

-- Create index for token lookups
CREATE INDEX idx_simple_order_tokens_token ON public.simple_order_tokens(token);
CREATE INDEX idx_simple_order_tokens_org ON public.simple_order_tokens(organization_id);