-- Add order_unit column to store the display order unit (Bestelleinheit) at order time
ALTER TABLE public.order_items 
ADD COLUMN order_unit TEXT;