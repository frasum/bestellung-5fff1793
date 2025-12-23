-- Add email-related fields to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS email_subject text,
ADD COLUMN IF NOT EXISTS email_from text,
ADD COLUMN IF NOT EXISTS email_received_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_message_id text;

-- Add invoice_email field to suppliers table for automatic matching
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS invoice_email text;

-- Create table to track processed emails (prevent duplicates)
CREATE TABLE IF NOT EXISTS public.invoice_email_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  email_from text NOT NULL,
  email_subject text,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'processed',
  error_message text,
  UNIQUE(organization_id, message_id)
);

-- Enable RLS on invoice_email_log
ALTER TABLE public.invoice_email_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice_email_log
CREATE POLICY "Users can view email logs in their organization"
ON public.invoice_email_log
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Service role can manage email logs"
ON public.invoice_email_log
FOR ALL
USING (true)
WITH CHECK (true);

-- Add last_email_check timestamp to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS last_invoice_email_check timestamp with time zone;