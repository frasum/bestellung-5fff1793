-- Create suggested_articles table for supplier article proposals
CREATE TABLE public.suggested_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Article fields
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'Stk',
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  
  -- Suggestion metadata
  supplier_comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  -- Prevent duplicate SKUs per supplier (when SKU is provided)
  CONSTRAINT unique_supplier_sku UNIQUE NULLS NOT DISTINCT (supplier_id, sku)
);

-- Enable RLS
ALTER TABLE public.suggested_articles ENABLE ROW LEVEL SECURITY;

-- Service role can insert (from Edge Function)
CREATE POLICY "Service role can insert suggested articles"
ON public.suggested_articles
FOR INSERT
WITH CHECK (true);

-- Service role can read
CREATE POLICY "Service role can read suggested articles"
ON public.suggested_articles
FOR SELECT
USING (true);

-- Users can view suggestions in their organization
CREATE POLICY "Users can view suggestions in their organization"
ON public.suggested_articles
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- Admins and managers can update suggestions
CREATE POLICY "Admins and managers can update suggestions"
ON public.suggested_articles
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Admins can delete suggestions
CREATE POLICY "Admins can delete suggestions"
ON public.suggested_articles
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin')
);