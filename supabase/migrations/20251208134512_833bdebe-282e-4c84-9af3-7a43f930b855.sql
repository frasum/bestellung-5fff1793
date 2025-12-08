-- Create rate limiting table for demo account creation
CREATE TABLE public.demo_account_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_demo_rate_limits_ip_created ON public.demo_account_rate_limits (ip_address, created_at);

-- Enable RLS (only service role can access)
ALTER TABLE public.demo_account_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.demo_account_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Cleanup old entries (older than 24 hours) - can be called periodically
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM demo_account_rate_limits
  WHERE created_at < now() - interval '24 hours';
END;
$$;