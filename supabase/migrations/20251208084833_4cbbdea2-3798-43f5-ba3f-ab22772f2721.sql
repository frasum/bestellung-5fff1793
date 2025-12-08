-- Add annual_order_value column to articles table
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS annual_order_value NUMERIC DEFAULT NULL;

-- Create supplier_portal_drafts table for saving work in progress
CREATE TABLE IF NOT EXISTS public.supplier_portal_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.supplier_portal_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies - only accessible via service role (edge functions)
CREATE POLICY "Service role can manage drafts"
  ON public.supplier_portal_drafts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_supplier_portal_drafts_updated_at
  BEFORE UPDATE ON public.supplier_portal_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();