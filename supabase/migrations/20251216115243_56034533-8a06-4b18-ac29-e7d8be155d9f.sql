-- Add feature flag to customers table
ALTER TABLE supplier_b2b_customers 
ADD COLUMN IF NOT EXISTS has_purchase_feature boolean DEFAULT false;

-- Create customer vendors table
CREATE TABLE public.b2b_customer_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES supplier_b2b_customers(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create customer vendor articles table
CREATE TABLE public.b2b_customer_vendor_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES supplier_b2b_customers(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES b2b_customer_vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sku text,
  category text,
  price numeric DEFAULT 0,
  unit text DEFAULT 'Stk',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create customer purchase orders table
CREATE TABLE public.b2b_customer_purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES supplier_b2b_customers(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES b2b_customer_vendors(id) ON DELETE CASCADE,
  order_number text NOT NULL DEFAULT generate_b2b_purchase_order_number(),
  status text DEFAULT 'pending',
  total_amount numeric DEFAULT 0,
  delivery_date date,
  delivery_address text,
  notes text,
  email_sent boolean DEFAULT false,
  email_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create customer purchase order items table
CREATE TABLE public.b2b_customer_purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES b2b_customer_purchase_orders(id) ON DELETE CASCADE,
  article_id uuid REFERENCES b2b_customer_vendor_articles(id),
  article_name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit text DEFAULT 'Stk',
  unit_price numeric DEFAULT 0,
  total_price numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE b2b_customer_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_customer_vendor_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_customer_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_customer_purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Customers can only see their OWN data (Luigi has NO access!)

-- Customer vendors policies
CREATE POLICY "Customers can manage their own vendors"
ON b2b_customer_vendors FOR ALL
USING (customer_id = get_b2b_customer_id(auth.uid()));

-- Customer vendor articles policies
CREATE POLICY "Customers can manage their own vendor articles"
ON b2b_customer_vendor_articles FOR ALL
USING (customer_id = get_b2b_customer_id(auth.uid()));

-- Customer purchase orders policies
CREATE POLICY "Customers can manage their own purchase orders"
ON b2b_customer_purchase_orders FOR ALL
USING (customer_id = get_b2b_customer_id(auth.uid()));

-- Customer purchase order items policies
CREATE POLICY "Customers can manage their own purchase order items"
ON b2b_customer_purchase_order_items FOR ALL
USING (order_id IN (
  SELECT id FROM b2b_customer_purchase_orders 
  WHERE customer_id = get_b2b_customer_id(auth.uid())
));

-- Add indexes for performance
CREATE INDEX idx_b2b_customer_vendors_customer ON b2b_customer_vendors(customer_id);
CREATE INDEX idx_b2b_customer_vendor_articles_customer ON b2b_customer_vendor_articles(customer_id);
CREATE INDEX idx_b2b_customer_vendor_articles_vendor ON b2b_customer_vendor_articles(vendor_id);
CREATE INDEX idx_b2b_customer_purchase_orders_customer ON b2b_customer_purchase_orders(customer_id);
CREATE INDEX idx_b2b_customer_purchase_orders_vendor ON b2b_customer_purchase_orders(vendor_id);
CREATE INDEX idx_b2b_customer_purchase_order_items_order ON b2b_customer_purchase_order_items(order_id);