-- Add voice_input_enabled column to employees table for voice order prototype
ALTER TABLE public.employees 
ADD COLUMN voice_input_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.employees.voice_input_enabled IS 
  'Enables voice input prototype for this employee in Easy Order';