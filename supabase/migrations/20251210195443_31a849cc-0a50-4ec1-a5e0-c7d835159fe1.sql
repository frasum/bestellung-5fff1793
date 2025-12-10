-- Add employee_name field to simple_order_tokens for personalized QR codes
ALTER TABLE public.simple_order_tokens 
ADD COLUMN employee_name TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.simple_order_tokens.employee_name IS 'Optional employee name for personalized QR codes. When set, the name is pre-filled and locked in the Easy Order form.';