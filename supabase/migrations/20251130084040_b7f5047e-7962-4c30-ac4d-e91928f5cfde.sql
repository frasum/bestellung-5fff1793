-- Add 'draft' status to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'draft' BEFORE 'pending';

-- Create cart_drafts table for storing draft carts
CREATE TABLE public.cart_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Entwurf',
  notes TEXT,
  delivery_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cart_draft_items table for storing items in a draft
CREATE TABLE public.cart_draft_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id UUID NOT NULL REFERENCES public.cart_drafts(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cart_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_draft_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for cart_drafts
CREATE POLICY "Users can view drafts in their organization"
ON public.cart_drafts FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can insert drafts in their organization"
ON public.cart_drafts FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their own drafts"
ON public.cart_drafts FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete their own drafts"
ON public.cart_drafts FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid());

-- RLS policies for cart_draft_items
CREATE POLICY "Users can view draft items for their drafts"
ON public.cart_draft_items FOR SELECT
USING (draft_id IN (SELECT id FROM cart_drafts WHERE organization_id = get_user_organization_id(auth.uid())));

CREATE POLICY "Users can insert draft items"
ON public.cart_draft_items FOR INSERT
WITH CHECK (draft_id IN (SELECT id FROM cart_drafts WHERE organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid()));

CREATE POLICY "Users can update draft items"
ON public.cart_draft_items FOR UPDATE
USING (draft_id IN (SELECT id FROM cart_drafts WHERE organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid()));

CREATE POLICY "Users can delete draft items"
ON public.cart_draft_items FOR DELETE
USING (draft_id IN (SELECT id FROM cart_drafts WHERE organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_cart_drafts_updated_at
BEFORE UPDATE ON public.cart_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();