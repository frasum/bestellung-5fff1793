-- Create table to track invoice processing status for real-time progress updates
CREATE TABLE public.invoice_processing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  total_pdfs INTEGER NOT NULL DEFAULT 0,
  processed_pdfs INTEGER NOT NULL DEFAULT 0,
  new_invoices INTEGER NOT NULL DEFAULT 0,
  skipped_duplicates INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_processing_status ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's processing status
CREATE POLICY "Users can view their org processing status" 
  ON public.invoice_processing_status 
  FOR SELECT 
  USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Enable realtime for live progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_processing_status;

-- Index for efficient queries
CREATE INDEX idx_invoice_processing_status_org_id ON public.invoice_processing_status(organization_id);
CREATE INDEX idx_invoice_processing_status_status ON public.invoice_processing_status(status);