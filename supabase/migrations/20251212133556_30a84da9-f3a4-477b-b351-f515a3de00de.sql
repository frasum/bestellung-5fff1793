-- Add order_unit_id column to articles table for linking to order_units
ALTER TABLE public.articles 
ADD COLUMN order_unit_id uuid REFERENCES public.order_units(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_articles_order_unit_id ON public.articles(order_unit_id);