-- Add order_delivery_method column to b2b_suppliers table
ALTER TABLE public.b2b_suppliers 
ADD COLUMN order_delivery_method text NOT NULL DEFAULT 'email' 
CHECK (order_delivery_method IN ('email', 'portal', 'both'));