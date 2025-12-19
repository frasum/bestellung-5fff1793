-- B2B Inventur-Sitzungen Tabelle
CREATE TABLE public.b2b_inventory_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_account_id uuid NOT NULL REFERENCES supplier_b2b_accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Inventur',
  status text NOT NULL DEFAULT 'in_progress',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- B2B Inventur-Items Tabelle
CREATE TABLE public.b2b_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES b2b_inventory_sessions(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES b2b_supplier_vendor_articles(id) ON DELETE CASCADE,
  storage_1 numeric NOT NULL DEFAULT 0,
  storage_2 numeric NOT NULL DEFAULT 0,
  total numeric GENERATED ALWAYS AS (storage_1 + storage_2) STORED,
  unit_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, article_id)
);

-- Enable RLS
ALTER TABLE public.b2b_inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_inventory_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies für b2b_inventory_sessions
CREATE POLICY "Supplier owners can manage inventory sessions"
ON public.b2b_inventory_sessions
FOR ALL
USING (is_b2b_supplier_owner(auth.uid(), supplier_account_id));

-- RLS Policies für b2b_inventory_items
CREATE POLICY "Supplier owners can manage inventory items"
ON public.b2b_inventory_items
FOR ALL
USING (
  session_id IN (
    SELECT id FROM b2b_inventory_sessions
    WHERE is_b2b_supplier_owner(auth.uid(), supplier_account_id)
  )
);

-- Trigger für updated_at
CREATE TRIGGER update_b2b_inventory_items_updated_at
BEFORE UPDATE ON public.b2b_inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();