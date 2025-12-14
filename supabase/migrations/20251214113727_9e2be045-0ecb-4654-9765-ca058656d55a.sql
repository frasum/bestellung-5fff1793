-- Add wine-specific attribute fields to articles table
ALTER TABLE public.articles 
  ADD COLUMN grape_variety TEXT,
  ADD COLUMN flavor_profile TEXT,
  ADD COLUMN food_pairings TEXT;