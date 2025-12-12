-- Add PIN code column to employees table for auto-approve security
ALTER TABLE employees ADD COLUMN pin_code TEXT DEFAULT NULL;

-- Add a constraint to ensure pin_code is exactly 4 digits if set
ALTER TABLE employees ADD CONSTRAINT employees_pin_code_format 
  CHECK (pin_code IS NULL OR pin_code ~ '^[0-9]{4}$');