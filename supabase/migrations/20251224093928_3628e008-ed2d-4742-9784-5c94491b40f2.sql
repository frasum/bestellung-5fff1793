-- Phase 1: Kritische Indexes (Höchste Priorität)

-- 1. supplier_b2b_accounts - Owner-Lookup optimieren
CREATE INDEX IF NOT EXISTS idx_supplier_b2b_accounts_owner_user_id 
ON supplier_b2b_accounts(owner_user_id);

-- Functional Index für Email-Lookup (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_supplier_b2b_accounts_email_lower 
ON supplier_b2b_accounts(lower(email));

-- 2. cart_draft_items - Foreign Key Index für draft_id
CREATE INDEX IF NOT EXISTS idx_cart_draft_items_draft_id 
ON cart_draft_items(draft_id);

-- 3. delivery_addresses - Organization Lookup
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_organization_id 
ON delivery_addresses(organization_id);

-- Partial Index für Location-basierte Abfragen
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_location_id 
ON delivery_addresses(location_id) WHERE location_id IS NOT NULL;

-- Phase 2: Mittel-Priorität

-- 4. invoice_discrepancies - Invoice Lookup
CREATE INDEX IF NOT EXISTS idx_invoice_discrepancies_invoice_id 
ON invoice_discrepancies(invoice_id);

-- 5. inventory_sessions - Organization Lookup
CREATE INDEX IF NOT EXISTS idx_inventory_sessions_organization_id 
ON inventory_sessions(organization_id);

-- 6. communication_logs - Häufige Filter
CREATE INDEX IF NOT EXISTS idx_communication_logs_organization_id 
ON communication_logs(organization_id);

-- Index für zeitbasierte Sortierung (neueste zuerst)
CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at 
ON communication_logs(created_at DESC);