-- Create rate limiting table for magic link requests
CREATE TABLE public.magic_link_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_magic_link_rate_limits_supplier_created ON public.magic_link_rate_limits (supplier_id, created_at);

-- Enable RLS (only service role can access)
ALTER TABLE public.magic_link_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage magic link rate limits"
ON public.magic_link_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup function for magic link rate limits
CREATE OR REPLACE FUNCTION public.cleanup_old_magic_link_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM magic_link_rate_limits
  WHERE created_at < now() - interval '1 hour';
END;
$$;