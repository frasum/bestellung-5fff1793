-- Create user_delivery_preferences table
CREATE TABLE public.user_delivery_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  delivery_address_id UUID NOT NULL REFERENCES public.delivery_addresses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, location_id)
);

-- Enable RLS
ALTER TABLE public.user_delivery_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own delivery preferences"
ON public.user_delivery_preferences
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own delivery preferences"
ON public.user_delivery_preferences
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own delivery preferences"
ON public.user_delivery_preferences
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own preferences
CREATE POLICY "Users can delete own delivery preferences"
ON public.user_delivery_preferences
FOR DELETE
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_user_delivery_preferences_updated_at
BEFORE UPDATE ON public.user_delivery_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();