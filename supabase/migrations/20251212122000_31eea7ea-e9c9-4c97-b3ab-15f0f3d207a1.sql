-- Add employee_id column to cart_drafts for tracking which employee created the draft
ALTER TABLE public.cart_drafts 
ADD COLUMN employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Create index for efficient querying by employee
CREATE INDEX idx_cart_drafts_employee_id ON public.cart_drafts(employee_id);

-- Comment for documentation
COMMENT ON COLUMN public.cart_drafts.employee_id IS 'Employee who created this draft via EasyOrder (null for regular user drafts)';