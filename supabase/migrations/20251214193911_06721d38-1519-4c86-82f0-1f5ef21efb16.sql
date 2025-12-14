-- Add translation columns for wine content (EN/TH)
ALTER TABLE public.articles 
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS description_th TEXT,
  ADD COLUMN IF NOT EXISTS grape_variety_en TEXT,
  ADD COLUMN IF NOT EXISTS grape_variety_th TEXT,
  ADD COLUMN IF NOT EXISTS flavor_profile_en TEXT,
  ADD COLUMN IF NOT EXISTS flavor_profile_th TEXT,
  ADD COLUMN IF NOT EXISTS food_pairings_en TEXT,
  ADD COLUMN IF NOT EXISTS food_pairings_th TEXT,
  ADD COLUMN IF NOT EXISTS origin_country_en TEXT,
  ADD COLUMN IF NOT EXISTS origin_country_th TEXT;