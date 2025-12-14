-- Add origin_country column to articles table
ALTER TABLE public.articles 
ADD COLUMN origin_country text;

-- Add origin_country column to suggested_articles table
ALTER TABLE public.suggested_articles 
ADD COLUMN origin_country text;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.origin_country IS 'Country of origin for the product (e.g., Deutschland, Italien, Frankreich)';
COMMENT ON COLUMN public.suggested_articles.origin_country IS 'Country of origin for the suggested product';