-- Drop the existing constraint
ALTER TABLE employee_order_submissions 
DROP CONSTRAINT IF EXISTS employee_order_submissions_submission_type_check;

-- Add new constraint including 'simple' type
ALTER TABLE employee_order_submissions 
ADD CONSTRAINT employee_order_submissions_submission_type_check 
CHECK (submission_type = ANY (ARRAY['photo', 'voice', 'manual', 'simple']));