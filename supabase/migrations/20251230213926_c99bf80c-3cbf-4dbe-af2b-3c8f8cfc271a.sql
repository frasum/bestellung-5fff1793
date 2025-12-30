-- Add special_attributes column for wine characteristics (Bio, Vegan, Biodynamisch, Demeter, Alte Reben)
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS special_attributes text;

-- Add comment for documentation
COMMENT ON COLUMN public.articles.special_attributes IS 'Comma-separated wine characteristics like Bio, Vegan, Biodynamisch, Demeter, Alte Reben';