-- Sequence für Bestellnummern zuerst erstellen
CREATE SEQUENCE IF NOT EXISTS public.supplier_own_order_seq START 1;

-- Bestellungen des Lieferanten bei seinen eigenen Händlern
CREATE TABLE public.supplier_own_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.supplier_own_vendors(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL DEFAULT ('EK-' || to_char(now(), 'YYYY-MM-') || LPAD((nextval('public.supplier_own_order_seq')::TEXT), 4, '0')),
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC DEFAULT 0,
  delivery_date DATE,
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bestellpositionen
CREATE TABLE public.supplier_own_purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.supplier_own_purchase_orders(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.supplier_own_articles(id) ON DELETE SET NULL,
  article_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'Stk',
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_own_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_own_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies für supplier_own_purchase_orders
CREATE POLICY "Service role can manage supplier_own_purchase_orders"
ON public.supplier_own_purchase_orders
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies für supplier_own_purchase_order_items
CREATE POLICY "Service role can manage supplier_own_purchase_order_items"
ON public.supplier_own_purchase_order_items
FOR ALL
USING (true)
WITH CHECK (true);

-- Update trigger für updated_at
CREATE TRIGGER update_supplier_own_purchase_orders_updated_at
BEFORE UPDATE ON public.supplier_own_purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();