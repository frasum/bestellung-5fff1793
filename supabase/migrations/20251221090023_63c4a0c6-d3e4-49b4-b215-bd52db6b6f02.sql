-- Create employee_sessions table for desktop employee portal authentication
CREATE TABLE public.employee_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '8 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.employee_sessions ENABLE ROW LEVEL SECURITY;

-- Create index for faster token lookups
CREATE INDEX idx_employee_sessions_token ON public.employee_sessions(token);
CREATE INDEX idx_employee_sessions_expires_at ON public.employee_sessions(expires_at);

-- Policy: Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage sessions"
  ON public.employee_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_employee_sessions()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.employee_sessions WHERE expires_at < now();
$$;