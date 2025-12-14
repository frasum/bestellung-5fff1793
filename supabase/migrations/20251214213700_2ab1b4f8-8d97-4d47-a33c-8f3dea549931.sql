-- Fix employee languages based on their personalized Thai tokens
UPDATE employees e
SET language = 'th'
WHERE e.id IN (
  SELECT DISTINCT t.employee_id 
  FROM simple_order_tokens t
  WHERE t.employee_id IS NOT NULL 
    AND t.language = 'th'
    AND t.is_multi_supplier = false
);

-- Synchronize all token languages with their employee's language
UPDATE simple_order_tokens t
SET language = e.language
FROM employees e
WHERE t.employee_id = e.id;