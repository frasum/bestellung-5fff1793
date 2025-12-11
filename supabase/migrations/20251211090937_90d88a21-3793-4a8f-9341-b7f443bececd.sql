-- Add sort_order column to simple_order_token_suppliers for token-specific supplier ordering
ALTER TABLE public.simple_order_token_suppliers 
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Add sort_order column to articles for global article ordering
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Create index for efficient sorting queries
CREATE INDEX IF NOT EXISTS idx_simple_order_token_suppliers_sort 
ON public.simple_order_token_suppliers(token_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_articles_sort_order 
ON public.articles(supplier_id, sort_order);