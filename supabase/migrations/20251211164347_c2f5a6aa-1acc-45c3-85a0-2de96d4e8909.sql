-- Add delivery date and time window columns to cart_drafts for Easy Order
ALTER TABLE public.cart_drafts 
ADD COLUMN desired_delivery_date DATE NULL,
ADD COLUMN desired_time_window TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.cart_drafts.desired_delivery_date IS 'Desired delivery date from Easy Order submissions';
COMMENT ON COLUMN public.cart_drafts.desired_time_window IS 'Desired delivery time window from Easy Order submissions (e.g., 06:00-10:00)';