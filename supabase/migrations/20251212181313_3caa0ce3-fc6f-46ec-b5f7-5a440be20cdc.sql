-- Add auto_approve_orders column to employees table
ALTER TABLE public.employees 
ADD COLUMN auto_approve_orders BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.employees.auto_approve_orders IS 'When true, EasyOrder submissions from this employee are processed as direct orders instead of pre-orders';