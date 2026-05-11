
# Migration bestellung.pro → Restaurant Hub (Schema-Erweiterung + Daten)

Da Restaurant Hub ein minimales Schema hat, erweitern wir es zuerst, damit alle relevanten Daten Platz finden. Anschließend werden Suppliers, Articles (→ Products), Orders und Order-Items in **ein bestehendes Restaurant** importiert.

## Phase 1: Zielschema in Restaurant Hub erweitern

Die Schema-Migration läuft im **Zielprojekt** (Restaurant Hub). Sie ist additiv (nur neue Spalten), bestehende App bleibt funktionsfähig.

- **`suppliers`**: Neue Spalten — `website`, `address`, `postal_code`, `city`, `country`, `contact_person`, `min_order_value`, `customer_number`, `iban`, `delivery_days`, `external_id` (uuid, indexiert)
- **`products`**: Neue Spalten — `sku`, `description`, `category`, `top_category`, `packaging_unit`, `reference_unit`, `reference_price`, `selling_price`, `image_url`, `is_active` (default true), `sort_order`, `external_id` (uuid)
- **`orders`**: Neue Spalten — `order_number`, `delivery_date`, `time_window`, `external_id` (uuid). Order-Status-Enum bleibt — Quell-Status wird gemappt (siehe unten).
- **`order_items`**: Neue Spalten — `packaging_unit`, `external_id` (uuid). Trigger `total_price_at_order = quantity * unit_price_snapshot` bleibt aktiv.

`external_id` speichert die UUID aus bestellung.pro → idempotenter Re-Import + spätere Zuordnung möglich.

## Phase 2: Mandanten-Mapping

Du wählst beim Aufruf der Migration **ein Ziel-Restaurant** (UUID aus Restaurant Hub `restaurants`). Alle `organization_id`/`location_id`-Referenzen aus bestellung.pro werden auf dieses eine `restaurant_id` umgebogen.

Ich liste dir vor dem Lauf die verfügbaren Restaurants aus dem Ziel auf, du gibst die UUID an.

## Phase 3: Migrations-Edge-Function

Temporäre Function `migrate-to-restaurant-hub` in **bestellung.pro**:

1. Liest mit lokalem Service Role Key:
   - `suppliers WHERE organization_id = ?` (optional Filter)
   - `articles WHERE supplier_id IN (...)`
   - `orders WHERE supplier_id IN (...)`
   - `order_items WHERE order_id IN (...)`
2. Schreibt mit Target-Service-Role-Key in Restaurant Hub via `upsert onConflict: external_id`:
   - **suppliers**: name, contact_email←email, contact_phone←phone, notes, + erweiterte Felder, `restaurant_id`=Ziel-UUID, `external_id`=Quell-`id`
   - **products** (aus articles): name, unit, unit_price←price, + erweiterte Felder, `supplier_id`=neue Supplier-UUID (über `external_id` nachgeschlagen)
   - **orders**: status (Mapping: `draft|cart`→`pending`, `sent|confirmed`→`sent`, `received|delivered`→`received`, `cancelled`→`cancelled`), notes, `supplier_id`, `external_id`. Trigger berechnet `total_price` selbst.
   - **order_items**: `order_id` (über external_id nachgeschlagen), `product_id` (über external_id), `product_name_snapshot`=article.name, `quantity`, `unit_price_snapshot`=order_item.unit_price. Trigger setzt `total_price_at_order`.
3. Batchweise je 500 Records, sequenziell in FK-Reihenfolge.
4. Reportet pro Tabelle: gelesen / geschrieben / Fehler.

## Phase 4: Verifikation & Cleanup

1. Test-Aufruf mit `dry_run=true` (zählt nur, schreibt nicht) → Ergebnis prüfen
2. Echter Lauf
3. Stichprobe via `read_query` im Ziel: 5 Suppliers, 5 Products, 1 Order mit Items
4. Edge Function wieder löschen

## Was du beisteuerst

- **1 Secret** im bestellung.pro-Projekt: `TARGET_SERVICE_ROLE_KEY` (Service Role Key von Restaurant Hub, einmalig im sicheren Formular)
- **1 Secret**: `TARGET_SUPABASE_URL` (z.B. `https://<ref>.supabase.co` von Restaurant Hub)
- **1 UUID**: das Ziel-Restaurant, in das alles importiert wird
- Optional: Quell-`organization_id`, falls nur eine bestimmte Org migriert werden soll (sonst: alle)

## Datenverlust / Hinweise

- **Mehrsprachige Felder** (`description_fr`, `flavor_profile_th`, etc.) auf Artikeln: werden in Phase 1 NICHT mit erweitert (zu speziell für Restaurant Hub). Falls gewünscht, sag Bescheid — dann ergänze ich sie.
- **Locations** (Multi-Standort) entfallen — alle Daten landen in einem Restaurant.
- **Order-Status-Mapping** ist verlustbehaftet (manche Zwischenstatus → `pending`).
- **Soft-deleted Artikel** (`is_active=false`) werden mit übernommen, da `is_active` ergänzt wird.
