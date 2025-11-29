-- Add minimum order value column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN minimum_order_value numeric DEFAULT 0;