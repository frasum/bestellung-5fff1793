-- Add color_scheme column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN color_scheme text DEFAULT 'default';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.color_scheme IS 'User preferred color scheme: default, orange, blue, green';