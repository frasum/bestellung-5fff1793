-- Add location_id and customer_number to invoices table for automatic location assignment
ALTER TABLE public.invoices 
ADD COLUMN location_id uuid REFERENCES public.locations(id),
ADD COLUMN customer_number text;

-- Add index for faster lookups
CREATE INDEX idx_invoices_location_id ON public.invoices(location_id);
CREATE INDEX idx_invoices_customer_number ON public.invoices(customer_number);