-- Add explicit RLS policy for pin_verification_rate_limits table
-- This table should only be accessible by Edge Functions via service role

CREATE POLICY "Service role can manage rate limits"
ON public.pin_verification_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);