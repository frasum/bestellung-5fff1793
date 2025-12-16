-- Create tables for B2B Supplier Purchase Module ("Mein Einkauf")

-- Luigi's own suppliers (vendors)
CREATE TABLE public.b2b_supplier_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id uuid NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Articles from Luigi's vendors
CREATE TABLE public.b2b_supplier_vendor_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.b2b_supplier_vendors(id) ON DELETE CASCADE,
  supplier_account_id uuid NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) DEFAULT 0,
  unit text DEFAULT 'Stk',
  sku text,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sequence for purchase order numbers
CREATE SEQUENCE IF NOT EXISTS b2b_purchase_order_number_seq START 1;

-- Function to generate purchase order numbers
CREATE OR REPLACE FUNCTION public.generate_b2b_purchase_order_number()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  new_number TEXT;
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := to_char(now(), 'YYYY-MM');
  seq_num := nextval('b2b_purchase_order_number_seq');
  new_number := 'EK-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$function$;

-- Luigi's purchase orders to his vendors
CREATE TABLE public.b2b_supplier_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id uuid NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.b2b_supplier_vendors(id) ON DELETE CASCADE,
  order_number text NOT NULL DEFAULT generate_b2b_purchase_order_number(),
  status text DEFAULT 'pending',
  delivery_date date,
  delivery_address text,
  notes text,
  total_amount numeric(10,2) DEFAULT 0,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Purchase order line items
CREATE TABLE public.b2b_supplier_purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.b2b_supplier_purchase_orders(id) ON DELETE CASCADE,
  article_id uuid REFERENCES public.b2b_supplier_vendor_articles(id) ON DELETE SET NULL,
  article_name text NOT NULL,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit text DEFAULT 'Stk',
  unit_price numeric(10,2) DEFAULT 0,
  total_price numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.b2b_supplier_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_supplier_vendor_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_supplier_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_supplier_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for b2b_supplier_vendors
CREATE POLICY "Supplier owners can manage their vendors"
ON public.b2b_supplier_vendors
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- RLS Policies for b2b_supplier_vendor_articles
CREATE POLICY "Supplier owners can manage vendor articles"
ON public.b2b_supplier_vendor_articles
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- RLS Policies for b2b_supplier_purchase_orders
CREATE POLICY "Supplier owners can manage purchase orders"
ON public.b2b_supplier_purchase_orders
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- RLS Policies for b2b_supplier_purchase_order_items
CREATE POLICY "Supplier owners can manage purchase order items"
ON public.b2b_supplier_purchase_order_items
FOR ALL
USING (order_id IN (
  SELECT id FROM public.b2b_supplier_purchase_orders
  WHERE is_b2b_supplier_owner(auth.uid(), supplier_account_id)
));

-- Indexes for performance
CREATE INDEX idx_b2b_supplier_vendors_account ON public.b2b_supplier_vendors(supplier_account_id);
CREATE INDEX idx_b2b_supplier_vendor_articles_vendor ON public.b2b_supplier_vendor_articles(vendor_id);
CREATE INDEX idx_b2b_supplier_vendor_articles_account ON public.b2b_supplier_vendor_articles(supplier_account_id);
CREATE INDEX idx_b2b_supplier_purchase_orders_account ON public.b2b_supplier_purchase_orders(supplier_account_id);
CREATE INDEX idx_b2b_supplier_purchase_orders_vendor ON public.b2b_supplier_purchase_orders(vendor_id);
CREATE INDEX idx_b2b_supplier_purchase_order_items_order ON public.b2b_supplier_purchase_order_items(order_id);