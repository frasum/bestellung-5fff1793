-- Create table to track supplier order views (seen/confirmed status)
CREATE TABLE public.supplier_order_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  seen_at timestamp with time zone,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, order_id)
);

-- Enable RLS
ALTER TABLE public.supplier_order_views ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all views (used by edge function)
CREATE POLICY "Service role can manage supplier order views"
ON public.supplier_order_views
FOR ALL
USING (true)
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_supplier_order_views_supplier_id ON public.supplier_order_views(supplier_id);
CREATE INDEX idx_supplier_order_views_order_id ON public.supplier_order_views(order_id);