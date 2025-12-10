-- Drop employee_order_items table first (has foreign key to employee_order_submissions)
DROP TABLE IF EXISTS public.employee_order_items CASCADE;

-- Drop employee_order_submissions table
DROP TABLE IF EXISTS public.employee_order_submissions CASCADE;