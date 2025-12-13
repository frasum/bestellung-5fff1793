-- Create table for photo capture tokens (separate from simple_order_tokens for clarity)
CREATE TABLE public.photo_capture_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex') UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS
ALTER TABLE public.photo_capture_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create tokens for their organization"
ON public.photo_capture_tokens
FOR INSERT
WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can view their own tokens"
ON public.photo_capture_tokens
FOR SELECT
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND user_id = auth.uid()
);

CREATE POLICY "Users can delete their own tokens"
ON public.photo_capture_tokens
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND user_id = auth.uid()
);

CREATE POLICY "Service role can read all tokens"
ON public.photo_capture_tokens
FOR SELECT
USING (true);

-- Index for token lookup
CREATE INDEX idx_photo_capture_tokens_token ON public.photo_capture_tokens(token);
CREATE INDEX idx_photo_capture_tokens_expires ON public.photo_capture_tokens(expires_at);