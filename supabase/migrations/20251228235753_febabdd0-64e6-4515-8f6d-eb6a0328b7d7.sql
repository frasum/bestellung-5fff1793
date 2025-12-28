-- Create active_carts table for persistent shopping cart
CREATE TABLE public.active_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  delivery_date date,
  time_window text,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One active cart per user
CREATE UNIQUE INDEX active_carts_user_id_idx ON public.active_carts(user_id);

-- Create active_cart_items table
CREATE TABLE public.active_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES active_carts(id) ON DELETE CASCADE,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  is_free_text_item boolean DEFAULT false,
  free_text_name text,
  free_text_unit text DEFAULT 'Stk',
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX active_cart_items_cart_id_idx ON public.active_cart_items(cart_id);

-- Enable RLS
ALTER TABLE public.active_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for active_carts
CREATE POLICY "Users can view their own cart"
  ON public.active_carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart"
  ON public.active_carts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update their own cart"
  ON public.active_carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart"
  ON public.active_carts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for active_cart_items
CREATE POLICY "Users can view their cart items"
  ON public.active_cart_items FOR SELECT
  USING (cart_id IN (SELECT id FROM active_carts WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their cart items"
  ON public.active_cart_items FOR INSERT
  WITH CHECK (cart_id IN (SELECT id FROM active_carts WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their cart items"
  ON public.active_cart_items FOR UPDATE
  USING (cart_id IN (SELECT id FROM active_carts WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their cart items"
  ON public.active_cart_items FOR DELETE
  USING (cart_id IN (SELECT id FROM active_carts WHERE user_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_active_carts_updated_at
  BEFORE UPDATE ON public.active_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();