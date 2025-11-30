-- Add top_category field to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN top_category text;