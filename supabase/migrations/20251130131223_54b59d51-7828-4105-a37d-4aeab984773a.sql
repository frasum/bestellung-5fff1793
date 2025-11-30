-- Create inventory_sessions table
CREATE TABLE public.inventory_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Inventur',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.inventory_sessions(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  storage_1 NUMERIC NOT NULL DEFAULT 0,
  storage_2 NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (storage_1 + storage_2) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, article_id)
);

-- Enable RLS
ALTER TABLE public.inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for inventory_sessions
CREATE POLICY "Users can view inventory sessions in their organization"
ON public.inventory_sessions FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can create inventory sessions"
ON public.inventory_sessions FOR INSERT
WITH CHECK (organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can update their own inventory sessions"
ON public.inventory_sessions FOR UPDATE
USING (organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Admins can delete inventory sessions"
ON public.inventory_sessions FOR DELETE
USING (organization_id = get_user_organization_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

-- RLS policies for inventory_items
CREATE POLICY "Users can view inventory items"
ON public.inventory_items FOR SELECT
USING (session_id IN (
  SELECT id FROM public.inventory_sessions 
  WHERE organization_id = get_user_organization_id(auth.uid())
));

CREATE POLICY "Users can insert inventory items"
ON public.inventory_items FOR INSERT
WITH CHECK (session_id IN (
  SELECT id FROM public.inventory_sessions 
  WHERE organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid()
));

CREATE POLICY "Users can update inventory items"
ON public.inventory_items FOR UPDATE
USING (session_id IN (
  SELECT id FROM public.inventory_sessions 
  WHERE organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid()
));

CREATE POLICY "Users can delete inventory items"
ON public.inventory_items FOR DELETE
USING (session_id IN (
  SELECT id FROM public.inventory_sessions 
  WHERE organization_id = get_user_organization_id(auth.uid()) AND user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();