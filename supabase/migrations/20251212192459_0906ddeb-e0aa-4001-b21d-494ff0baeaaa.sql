-- Create rate limiting table for PIN verification
CREATE TABLE IF NOT EXISTS public.pin_verification_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_pin_rate_limits_token_created ON public.pin_verification_rate_limits(token, created_at);

-- Enable RLS (but allow Edge Functions via service role)
ALTER TABLE public.pin_verification_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_pin_verification_rate_limits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.pin_verification_rate_limits
  WHERE created_at < now() - interval '15 minutes';
$$;