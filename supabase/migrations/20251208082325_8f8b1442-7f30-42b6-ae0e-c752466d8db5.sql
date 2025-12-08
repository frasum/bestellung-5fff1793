-- =============================================
-- DATABASE IMPROVEMENTS MIGRATION
-- =============================================

-- 1. FEHLENDE INDIZES HINZUFÜGEN
-- =============================================

-- Volltext-Suche für Artikelnamen
CREATE INDEX IF NOT EXISTS idx_articles_name_search 
ON public.articles USING gin(to_tsvector('german', name));

-- Inventory Sessions User-Filter
CREATE INDEX IF NOT EXISTS idx_inventory_sessions_user_id 
ON public.inventory_sessions(user_id);

-- Suggested Articles Status-Filter
CREATE INDEX IF NOT EXISTS idx_suggested_articles_status 
ON public.suggested_articles(status);

-- Supplier Article Changes Article-Filter
CREATE INDEX IF NOT EXISTS idx_supplier_article_changes_article_id 
ON public.supplier_article_changes(article_id);

-- Orders Location-Filter (häufig verwendet)
CREATE INDEX IF NOT EXISTS idx_orders_location_id 
ON public.orders(location_id);

-- Cart Drafts User-Filter
CREATE INDEX IF NOT EXISTS idx_cart_drafts_user_id 
ON public.cart_drafts(user_id);

-- 2. SUGGESTED_ARTICLES UNIQUE CONSTRAINT KORRIGIEREN
-- =============================================

-- Alten problematischen Constraint entfernen (falls vorhanden)
ALTER TABLE public.suggested_articles 
DROP CONSTRAINT IF EXISTS suggested_articles_supplier_id_sku_key;

-- Partial Unique Index: nur wenn SKU nicht NULL ist
CREATE UNIQUE INDEX IF NOT EXISTS idx_suggested_articles_supplier_sku_unique 
ON public.suggested_articles(supplier_id, sku) 
WHERE sku IS NOT NULL;

-- 3. FEHLENDE FOREIGN KEYS HINZUFÜGEN
-- =============================================

-- cart_drafts.user_id -> auth.users(id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cart_drafts_user_id_fkey'
  ) THEN
    ALTER TABLE public.cart_drafts 
    ADD CONSTRAINT cart_drafts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- inventory_sessions.user_id -> auth.users(id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'inventory_sessions_user_id_fkey'
  ) THEN
    ALTER TABLE public.inventory_sessions 
    ADD CONSTRAINT inventory_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- team_invitations.invited_by -> auth.users(id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'team_invitations_invited_by_fkey'
  ) THEN
    ALTER TABLE public.team_invitations 
    ADD CONSTRAINT team_invitations_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- orders.user_id -> auth.users(id)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;