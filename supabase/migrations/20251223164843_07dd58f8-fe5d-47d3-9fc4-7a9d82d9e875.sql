-- Create article_locations table for granular location assignment
CREATE TABLE public.article_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  custom_price numeric NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, location_id)
);

-- Enable RLS
ALTER TABLE public.article_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view article_locations in their organization"
ON public.article_locations
FOR SELECT
USING (
  article_id IN (
    SELECT id FROM public.articles 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Admins and managers can insert article_locations"
ON public.article_locations
FOR INSERT
WITH CHECK (
  article_id IN (
    SELECT id FROM public.articles 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins and managers can update article_locations"
ON public.article_locations
FOR UPDATE
USING (
  article_id IN (
    SELECT id FROM public.articles 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'))
);

CREATE POLICY "Admins can delete article_locations"
ON public.article_locations
FOR DELETE
USING (
  article_id IN (
    SELECT id FROM public.articles 
    WHERE organization_id = get_user_organization_id(auth.uid())
  )
  AND has_role(auth.uid(), 'admin')
);

-- Trigger for updated_at
CREATE TRIGGER update_article_locations_updated_at
BEFORE UPDATE ON public.article_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- MIGRATION: Assign all existing articles to all locations of their organization
INSERT INTO public.article_locations (article_id, location_id)
SELECT a.id, l.id
FROM public.articles a
CROSS JOIN public.locations l
WHERE a.organization_id = l.organization_id
ON CONFLICT (article_id, location_id) DO NOTHING;