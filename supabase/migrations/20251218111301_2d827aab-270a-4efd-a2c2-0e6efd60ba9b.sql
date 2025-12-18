-- Add order delivery method to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN order_delivery_method text DEFAULT 'email' 
CHECK (order_delivery_method IN ('email', 'portal', 'both'));

-- Add comment for documentation
COMMENT ON COLUMN public.suppliers.order_delivery_method IS 'How orders are delivered to this supplier: email, portal, or both';