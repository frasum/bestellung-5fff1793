-- Add language column to employees table
ALTER TABLE employees 
ADD COLUMN language TEXT DEFAULT 'de';

-- Migrate existing employee languages from their tokens
UPDATE employees e
SET language = COALESCE(
  (SELECT t.language FROM simple_order_tokens t 
   WHERE t.employee_id = e.id 
   ORDER BY t.created_at DESC 
   LIMIT 1),
  'de'
);