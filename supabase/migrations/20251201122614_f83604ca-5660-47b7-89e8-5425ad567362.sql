-- Create table for pending supplier article changes
CREATE TABLE public.supplier_article_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Enable RLS
ALTER TABLE public.supplier_article_changes ENABLE ROW LEVEL SECURITY;

-- Policies: Organization members can view and manage changes
CREATE POLICY "Users can view changes in their organization"
ON public.supplier_article_changes
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can update changes"
ON public.supplier_article_changes
FOR UPDATE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can delete changes"
ON public.supplier_article_changes
FOR DELETE
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

-- Allow service role to insert (from edge function)
CREATE POLICY "Service role can insert changes"
ON public.supplier_article_changes
FOR INSERT
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_supplier_article_changes_supplier ON public.supplier_article_changes(supplier_id);
CREATE INDEX idx_supplier_article_changes_status ON public.supplier_article_changes(status);