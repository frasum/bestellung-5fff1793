-- Add French translation columns for wine articles
ALTER TABLE public.articles 
  ADD COLUMN IF NOT EXISTS description_fr TEXT,
  ADD COLUMN IF NOT EXISTS grape_variety_fr TEXT,
  ADD COLUMN IF NOT EXISTS flavor_profile_fr TEXT,
  ADD COLUMN IF NOT EXISTS food_pairings_fr TEXT,
  ADD COLUMN IF NOT EXISTS origin_country_fr TEXT;