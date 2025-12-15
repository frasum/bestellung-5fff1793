-- Migration: Automatische Zuweisung von order_unit_id basierend auf unit-Feld

-- 1. Kiste → Kiste (30 Artikel)
UPDATE articles 
SET order_unit_id = 'f2b8d6df-e928-461e-a783-c130b3adb74e'
WHERE order_unit_id IS NULL AND unit = 'Kiste';

-- 2. Karton → Karton (1 Artikel)
UPDATE articles 
SET order_unit_id = 'b199e169-8300-4f9c-b989-7f8926b8f21c'
WHERE order_unit_id IS NULL AND unit = 'Karton';

-- 3. Packung → Packung (15 Artikel)
UPDATE articles 
SET order_unit_id = '80aab796-3131-4ebc-bae6-2fbe3a10ebfb'
WHERE order_unit_id IS NULL AND unit = 'Packung';

-- 4. Pkg → Packung (3 Artikel, Alias)
UPDATE articles 
SET order_unit_id = '80aab796-3131-4ebc-bae6-2fbe3a10ebfb'
WHERE order_unit_id IS NULL AND unit = 'Pkg';

-- 5. Flasche → Flasche (14 Artikel)
UPDATE articles 
SET order_unit_id = '8d6df313-158f-4a95-8b8c-955dab66a0ae'
WHERE order_unit_id IS NULL AND unit = 'Flasche';

-- 6. Träger → Träger (4 Artikel)
UPDATE articles 
SET order_unit_id = '0b131d66-6b53-4d5a-80a3-2790ec5604bd'
WHERE order_unit_id IS NULL AND unit = 'Träger';

-- 7. Bund → Bund (1 Artikel)
UPDATE articles 
SET order_unit_id = '9f124be3-0ddb-4322-ab35-56fa0aa957b3'
WHERE order_unit_id IS NULL AND unit = 'Bund';

-- 8. Dose → Dose (1 Artikel)
UPDATE articles 
SET order_unit_id = '7337ddb6-a8fe-48a6-8cab-1e8c6c210e29'
WHERE order_unit_id IS NULL AND unit = 'Dose';

-- 9. Stk → Stück (32 Artikel)
UPDATE articles 
SET order_unit_id = 'd7b5f9b2-80d0-4477-bbad-0ea3b75d1b1a'
WHERE order_unit_id IS NULL AND unit = 'Stk';