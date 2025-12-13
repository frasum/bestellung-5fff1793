-- Remove the PIN format check constraint that blocks bcrypt hashes
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_pin_code_format;