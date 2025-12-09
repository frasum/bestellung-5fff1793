-- Add packaging_unit column to articles table
ALTER TABLE public.articles 
ADD COLUMN packaging_unit integer DEFAULT NULL;

COMMENT ON COLUMN public.articles.packaging_unit IS 'Anzahl Einheiten pro Verpackung (z.B. 6 Flaschen pro Kiste)';