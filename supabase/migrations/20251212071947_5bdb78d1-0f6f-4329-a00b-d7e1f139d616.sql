-- Add reference price fields to articles table
ALTER TABLE public.articles 
ADD COLUMN reference_price numeric DEFAULT NULL,
ADD COLUMN reference_unit text DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.reference_price IS 'Reference price per standard unit (e.g., price per kg)';
COMMENT ON COLUMN public.articles.reference_unit IS 'Reference unit for price comparison (e.g., kg, L)';