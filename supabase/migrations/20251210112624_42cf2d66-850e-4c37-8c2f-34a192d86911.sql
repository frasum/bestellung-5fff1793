-- Add top_category field to articles table for 2-level category hierarchy
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS top_category text;

-- Add index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_articles_top_category ON public.articles(top_category);

-- Create composite index for organization + top_category filtering
CREATE INDEX IF NOT EXISTS idx_articles_org_top_category ON public.articles(organization_id, top_category);