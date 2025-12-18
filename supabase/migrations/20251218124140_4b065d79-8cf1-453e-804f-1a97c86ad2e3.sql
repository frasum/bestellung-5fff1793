-- Enum für B2B Supplier Rollen
CREATE TYPE public.b2b_supplier_role AS ENUM ('owner', 'manager', 'viewer');

-- Tabelle für Supplier-Benutzer (Lieferanten mit eigenem Login)
CREATE TABLE public.b2b_supplier_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  supplier_id uuid NOT NULL REFERENCES public.b2b_suppliers(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.supplier_b2b_accounts(id) ON DELETE CASCADE,
  role b2b_supplier_role NOT NULL DEFAULT 'manager',
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, supplier_id),
  UNIQUE(email, account_id)
);

-- Enable RLS
ALTER TABLE public.b2b_supplier_users ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check if user is a B2B supplier user for a specific supplier
CREATE OR REPLACE FUNCTION public.is_b2b_supplier_user(p_user_id uuid, p_supplier_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM b2b_supplier_users
    WHERE user_id = p_user_id AND supplier_id = p_supplier_id
  )
$$;

-- Helper Function: Get supplier ID for a B2B supplier user
CREATE OR REPLACE FUNCTION public.get_b2b_supplier_user_supplier_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT supplier_id FROM b2b_supplier_users WHERE user_id = p_user_id LIMIT 1
$$;

-- RLS Policies

-- Account owners can manage all supplier users in their account
CREATE POLICY "Account owners can manage supplier users"
ON public.b2b_supplier_users
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), account_id));

-- Users can view their own supplier user entry
CREATE POLICY "Users can view own supplier user entry"
ON public.b2b_supplier_users
FOR SELECT
USING (user_id = auth.uid());

-- Extend RLS policies for b2b_suppliers to allow supplier users to view their supplier
CREATE POLICY "Supplier users can view their own supplier"
ON public.b2b_suppliers
FOR SELECT
USING (is_b2b_supplier_user(auth.uid(), id));

-- Extend RLS policies for supplier_b2b_articles to allow supplier users
CREATE POLICY "Supplier users can manage their supplier articles"
ON public.supplier_b2b_articles
FOR ALL
USING (is_b2b_supplier_user(auth.uid(), supplier_id));

-- Extend RLS policies for supplier_b2b_orders to allow supplier users to view orders
CREATE POLICY "Supplier users can view their supplier orders"
ON public.supplier_b2b_orders
FOR SELECT
USING (is_b2b_supplier_user(auth.uid(), supplier_id));

-- Extend RLS policies for supplier_b2b_offers to allow supplier users
CREATE POLICY "Supplier users can manage their supplier offers"
ON public.supplier_b2b_offers
FOR ALL
USING (is_b2b_supplier_user(auth.uid(), supplier_id));

-- Trigger for updated_at
CREATE TRIGGER update_b2b_supplier_users_updated_at
BEFORE UPDATE ON public.b2b_supplier_users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();