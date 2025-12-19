-- Eigene Lieferanten des Lieferanten (z.B. Weingüter, Großhändler)
CREATE TABLE supplier_own_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Eigene Artikel des Lieferanten (bei seinen Lieferanten)
CREATE TABLE supplier_own_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES supplier_own_vendors(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'Stk',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventursitzungen für eigene Artikel
CREATE TABLE supplier_own_inventory_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES supplier_own_vendors(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Inventur',
  status TEXT DEFAULT 'in_progress',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inventurartikel für eigene Artikel
CREATE TABLE supplier_own_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES supplier_own_inventory_sessions(id) ON DELETE CASCADE NOT NULL,
  article_id UUID REFERENCES supplier_own_articles(id) ON DELETE CASCADE NOT NULL,
  storage_1 NUMERIC DEFAULT 0,
  storage_2 NUMERIC DEFAULT 0,
  total NUMERIC GENERATED ALWAYS AS (storage_1 + storage_2) STORED,
  unit_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, article_id)
);

-- Enable RLS
ALTER TABLE supplier_own_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_own_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_own_inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_own_inventory_items ENABLE ROW LEVEL SECURITY;

-- Policies: Service role can manage all (accessed via Edge Functions)
CREATE POLICY "Service role can manage supplier_own_vendors"
  ON supplier_own_vendors FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage supplier_own_articles"
  ON supplier_own_articles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage supplier_own_inventory_sessions"
  ON supplier_own_inventory_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage supplier_own_inventory_items"
  ON supplier_own_inventory_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes for better performance
CREATE INDEX idx_supplier_own_vendors_supplier_id ON supplier_own_vendors(supplier_id);
CREATE INDEX idx_supplier_own_articles_supplier_id ON supplier_own_articles(supplier_id);
CREATE INDEX idx_supplier_own_articles_vendor_id ON supplier_own_articles(vendor_id);
CREATE INDEX idx_supplier_own_inventory_sessions_supplier_id ON supplier_own_inventory_sessions(supplier_id);
CREATE INDEX idx_supplier_own_inventory_items_session_id ON supplier_own_inventory_items(session_id);