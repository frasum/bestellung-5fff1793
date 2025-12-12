-- Add employee_id to orders table to track which employee placed the order (via EasyOrder)
ALTER TABLE public.orders ADD COLUMN employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Add index for faster queries by employee
CREATE INDEX idx_orders_employee_id ON public.orders(employee_id);