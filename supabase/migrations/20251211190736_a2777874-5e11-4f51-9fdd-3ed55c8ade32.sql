-- Create employee_article_favorites table for EasyOrder favorites
CREATE TABLE public.employee_article_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, article_id)
);

-- Enable RLS
ALTER TABLE public.employee_article_favorites ENABLE ROW LEVEL SECURITY;

-- Service role can manage favorites (Edge Function access)
CREATE POLICY "Service role can manage favorites"
  ON public.employee_article_favorites FOR ALL
  USING (true) WITH CHECK (true);