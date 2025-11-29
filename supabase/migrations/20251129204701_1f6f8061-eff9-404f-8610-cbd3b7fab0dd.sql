-- Add customer_number column to suppliers table
ALTER TABLE public.suppliers
ADD COLUMN customer_number text;