-- Remove unused category columns from suppliers table
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS top_category;
ALTER TABLE public.suppliers DROP COLUMN IF EXISTS main_category;