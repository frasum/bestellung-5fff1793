-- Add selling_price column for restaurant menu prices (visible to staff)
ALTER TABLE public.articles ADD COLUMN selling_price numeric;

COMMENT ON COLUMN public.articles.selling_price IS 'Verkaufspreis im Restaurant (für Mitarbeiter-Info, nicht der Einkaufspreis)';