-- =============================================
-- SUPPLIER B2B PORTAL - Phase 1: Database Schema
-- =============================================

-- 1. Subscription tier enum for B2B accounts
CREATE TYPE public.b2b_subscription_tier AS ENUM ('starter', 'professional', 'enterprise');

-- 2. B2B order status enum
CREATE TYPE public.b2b_order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');

-- =============================================
-- CORE TABLES
-- =============================================

-- 3. Supplier B2B Accounts (Lieferanten-Konten)
CREATE TABLE public.supplier_b2b_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Link to existing supplier if they have one
  linked_supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  -- Account details
  company_name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL CHECK (subdomain ~ '^[a-z0-9-]+$'),
  email TEXT UNIQUE NOT NULL,
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  welcome_message TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  subscription_tier b2b_subscription_tier DEFAULT 'starter',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Supplier B2B Articles (Lieferanten-Artikel)
CREATE TABLE public.supplier_b2b_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  -- Article details
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT 'Stk',
  base_price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Supplier B2B Customers (Kunden des Lieferanten)
CREATE TABLE public.supplier_b2b_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  -- Link to Supabase Auth user
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Customer details
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  customer_number TEXT,
  contact_person TEXT,
  phone TEXT,
  delivery_address TEXT,
  -- Status
  is_active BOOLEAN DEFAULT true,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Unique email per supplier
  UNIQUE(supplier_account_id, email)
);

-- 6. Customer Article Prices (Individuelle Kundenpreise)
CREATE TABLE public.customer_article_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.supplier_b2b_customers(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.supplier_b2b_articles(id) ON DELETE CASCADE,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(customer_id, article_id)
);

-- 7. Supplier B2B Orders (Bestellungen)
CREATE TABLE public.supplier_b2b_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.supplier_b2b_customers(id) ON DELETE CASCADE,
  -- Order details
  order_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status b2b_order_status DEFAULT 'pending',
  notes TEXT,
  delivery_date DATE,
  delivery_address TEXT,
  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Supplier B2B Order Items (Bestellpositionen)
CREATE TABLE public.supplier_b2b_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.supplier_b2b_orders(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.supplier_b2b_articles(id) ON DELETE SET NULL,
  article_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. B2B Customer Invitation Tokens
CREATE TABLE public.b2b_customer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id UUID NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days') NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_b2b_articles_supplier ON public.supplier_b2b_articles(supplier_account_id);
CREATE INDEX idx_b2b_customers_supplier ON public.supplier_b2b_customers(supplier_account_id);
CREATE INDEX idx_b2b_customers_user ON public.supplier_b2b_customers(user_id);
CREATE INDEX idx_b2b_orders_supplier ON public.supplier_b2b_orders(supplier_account_id);
CREATE INDEX idx_b2b_orders_customer ON public.supplier_b2b_orders(customer_id);
CREATE INDEX idx_b2b_order_items_order ON public.supplier_b2b_order_items(order_id);
CREATE INDEX idx_b2b_accounts_subdomain ON public.supplier_b2b_accounts(subdomain);

-- =============================================
-- HELPER FUNCTIONS (Security Definer)
-- =============================================

-- Function to get supplier account ID from user
CREATE OR REPLACE FUNCTION public.get_b2b_supplier_account_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM supplier_b2b_accounts 
  WHERE id IN (
    SELECT supplier_account_id FROM supplier_b2b_customers WHERE user_id = p_user_id
  )
  OR id = (
    SELECT sba.id FROM supplier_b2b_accounts sba
    JOIN profiles p ON p.organization_id IN (
      SELECT organization_id FROM suppliers WHERE id = sba.linked_supplier_id
    )
    WHERE p.id = p_user_id
  )
  LIMIT 1
$$;

-- Function to check if user owns a B2B supplier account
CREATE OR REPLACE FUNCTION public.is_b2b_supplier_owner(p_user_id UUID, p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM supplier_b2b_accounts sba
    JOIN suppliers s ON s.id = sba.linked_supplier_id
    JOIN profiles p ON p.organization_id = s.organization_id
    WHERE sba.id = p_account_id AND p.id = p_user_id
  )
$$;

-- Function to check if user is a B2B customer
CREATE OR REPLACE FUNCTION public.is_b2b_customer(p_user_id UUID, p_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM supplier_b2b_customers
    WHERE user_id = p_user_id AND supplier_account_id = p_account_id AND is_active = true
  )
$$;

-- Function to get customer ID from user
CREATE OR REPLACE FUNCTION public.get_b2b_customer_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM supplier_b2b_customers WHERE user_id = p_user_id LIMIT 1
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.supplier_b2b_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_b2b_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_b2b_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_article_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_b2b_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_b2b_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_customer_invitations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: supplier_b2b_accounts
-- =============================================

-- Public can view accounts by subdomain (for login page)
CREATE POLICY "Public can view active accounts by subdomain"
ON public.supplier_b2b_accounts FOR SELECT
USING (is_active = true);

-- Supplier owners can update their account
CREATE POLICY "Supplier owners can update their account"
ON public.supplier_b2b_accounts FOR UPDATE
USING (is_b2b_supplier_owner(auth.uid(), id));

-- Service role can insert (for registration)
CREATE POLICY "Service role can insert accounts"
ON public.supplier_b2b_accounts FOR INSERT
WITH CHECK (true);

-- =============================================
-- RLS POLICIES: supplier_b2b_articles
-- =============================================

-- Supplier owners can manage articles
CREATE POLICY "Supplier owners can view their articles"
ON public.supplier_b2b_articles FOR SELECT
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Supplier owners can insert articles"
ON public.supplier_b2b_articles FOR INSERT
WITH CHECK (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Supplier owners can update articles"
ON public.supplier_b2b_articles FOR UPDATE
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Supplier owners can delete articles"
ON public.supplier_b2b_articles FOR DELETE
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- Customers can view active articles from their supplier
CREATE POLICY "Customers can view supplier articles"
ON public.supplier_b2b_articles FOR SELECT
USING (is_b2b_customer(auth.uid(), supplier_account_id) AND is_active = true);

-- =============================================
-- RLS POLICIES: supplier_b2b_customers
-- =============================================

-- Supplier owners can manage customers
CREATE POLICY "Supplier owners can view their customers"
ON public.supplier_b2b_customers FOR SELECT
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Supplier owners can insert customers"
ON public.supplier_b2b_customers FOR INSERT
WITH CHECK (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Supplier owners can update customers"
ON public.supplier_b2b_customers FOR UPDATE
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Supplier owners can delete customers"
ON public.supplier_b2b_customers FOR DELETE
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- Customers can view their own record
CREATE POLICY "Customers can view their own record"
ON public.supplier_b2b_customers FOR SELECT
USING (user_id = auth.uid());

-- Service role can update (for invitation acceptance)
CREATE POLICY "Service role can update customers"
ON public.supplier_b2b_customers FOR UPDATE
WITH CHECK (true);

-- =============================================
-- RLS POLICIES: customer_article_prices
-- =============================================

-- Supplier owners can manage prices
CREATE POLICY "Supplier owners can manage prices"
ON public.customer_article_prices FOR ALL
USING (
  customer_id IN (
    SELECT id FROM supplier_b2b_customers 
    WHERE is_b2b_supplier_owner(auth.uid(), supplier_account_id)
  )
);

-- Customers can view their own prices
CREATE POLICY "Customers can view their prices"
ON public.customer_article_prices FOR SELECT
USING (customer_id = get_b2b_customer_id(auth.uid()));

-- =============================================
-- RLS POLICIES: supplier_b2b_orders
-- =============================================

-- Supplier owners can view orders
CREATE POLICY "Supplier owners can view orders"
ON public.supplier_b2b_orders FOR SELECT
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

CREATE POLICY "Supplier owners can update orders"
ON public.supplier_b2b_orders FOR UPDATE
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- Customers can manage their own orders
CREATE POLICY "Customers can view their orders"
ON public.supplier_b2b_orders FOR SELECT
USING (customer_id = get_b2b_customer_id(auth.uid()));

CREATE POLICY "Customers can insert orders"
ON public.supplier_b2b_orders FOR INSERT
WITH CHECK (customer_id = get_b2b_customer_id(auth.uid()));

-- =============================================
-- RLS POLICIES: supplier_b2b_order_items
-- =============================================

-- Access through order
CREATE POLICY "Users can view order items through order access"
ON public.supplier_b2b_order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM supplier_b2b_orders 
    WHERE is_b2b_supplier_owner(auth.uid(), supplier_account_id)
    OR customer_id = get_b2b_customer_id(auth.uid())
  )
);

CREATE POLICY "Customers can insert order items"
ON public.supplier_b2b_order_items FOR INSERT
WITH CHECK (
  order_id IN (
    SELECT id FROM supplier_b2b_orders 
    WHERE customer_id = get_b2b_customer_id(auth.uid())
  )
);

-- =============================================
-- RLS POLICIES: b2b_customer_invitations
-- =============================================

-- Supplier owners can manage invitations
CREATE POLICY "Supplier owners can manage invitations"
ON public.b2b_customer_invitations FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- Public can view invitations by token (for acceptance)
CREATE POLICY "Public can view invitation by token"
ON public.b2b_customer_invitations FOR SELECT
USING (true);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps
CREATE TRIGGER update_supplier_b2b_accounts_updated_at
BEFORE UPDATE ON public.supplier_b2b_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_b2b_articles_updated_at
BEFORE UPDATE ON public.supplier_b2b_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_b2b_customers_updated_at
BEFORE UPDATE ON public.supplier_b2b_customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_article_prices_updated_at
BEFORE UPDATE ON public.customer_article_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_b2b_orders_updated_at
BEFORE UPDATE ON public.supplier_b2b_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ORDER NUMBER SEQUENCE
-- =============================================

CREATE SEQUENCE IF NOT EXISTS public.b2b_order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_b2b_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := to_char(now(), 'YYYY-MM');
  seq_num := nextval('b2b_order_number_seq');
  new_number := 'B2B-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_number;
END;
$$;