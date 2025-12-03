-- Add location_id column to cart_drafts table for location-specific filtering
ALTER TABLE public.cart_drafts
ADD COLUMN location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_cart_drafts_location_id ON public.cart_drafts(location_id);