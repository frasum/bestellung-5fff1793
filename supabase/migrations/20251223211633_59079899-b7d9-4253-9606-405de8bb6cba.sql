-- Create invoices table for uploaded invoices
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  matched_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  invoice_number TEXT,
  invoice_date DATE,
  delivery_date DATE,
  due_date DATE,
  net_amount NUMERIC,
  vat_amount NUMERIC,
  gross_amount NUMERIC,
  currency TEXT DEFAULT 'EUR',
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'matched', 'discrepancy', 'approved', 'rejected')),
  notes TEXT,
  parsed_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_items table for line items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  matched_order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  matched_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  position_number INTEGER,
  article_name TEXT NOT NULL,
  article_sku TEXT,
  quantity NUMERIC NOT NULL,
  unit TEXT,
  unit_price NUMERIC,
  total_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_discrepancies table for detected differences
CREATE TABLE public.invoice_discrepancies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  invoice_item_id UUID REFERENCES public.invoice_items(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  discrepancy_type TEXT NOT NULL CHECK (discrepancy_type IN ('price_increase', 'price_decrease', 'quantity_mismatch', 'missing_item', 'extra_item', 'other')),
  expected_value TEXT,
  actual_value TEXT,
  difference_amount NUMERIC,
  difference_percent NUMERIC,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_discrepancies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices in their organization"
  ON public.invoices FOR SELECT
  USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins and managers can insert invoices"
  ON public.invoices FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins and managers can update invoices"
  ON public.invoices FOR UPDATE
  USING (organization_id = get_user_organization_id(auth.uid()) 
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

CREATE POLICY "Admins can delete invoices"
  ON public.invoices FOR DELETE
  USING (organization_id = get_user_organization_id(auth.uid()) 
    AND has_role(auth.uid(), 'admin'));

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items for their invoices"
  ON public.invoice_items FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Service role can manage invoice items"
  ON public.invoice_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for invoice_discrepancies
CREATE POLICY "Users can view discrepancies for their invoices"
  ON public.invoice_discrepancies FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE organization_id = get_user_organization_id(auth.uid())
  ));

CREATE POLICY "Admins and managers can update discrepancies"
  ON public.invoice_discrepancies FOR UPDATE
  USING (invoice_id IN (
    SELECT id FROM public.invoices WHERE organization_id = get_user_organization_id(auth.uid())
  ) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager')));

CREATE POLICY "Service role can manage discrepancies"
  ON public.invoice_discrepancies FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);

-- Storage policies for invoices bucket
CREATE POLICY "Users can upload invoices to their organization folder"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view invoice files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices');

CREATE POLICY "Admins can delete invoice files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND auth.uid() IS NOT NULL);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;