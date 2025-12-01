-- Create table for article price history
CREATE TABLE public.article_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES auth.users(id),
  change_source TEXT NOT NULL DEFAULT 'manual' -- 'manual', 'supplier_portal', 'import'
);

-- Enable RLS
ALTER TABLE public.article_price_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view price history in their organization"
ON public.article_price_history
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert price history"
ON public.article_price_history
FOR INSERT
WITH CHECK (
  (organization_id = get_user_organization_id(auth.uid())) 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

-- Service role can insert (for edge functions)
CREATE POLICY "Service role can insert price history"
ON public.article_price_history
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_article_price_history_article_id ON public.article_price_history(article_id);
CREATE INDEX idx_article_price_history_changed_at ON public.article_price_history(changed_at DESC);