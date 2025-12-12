-- Add visible_columns to supplier_portal_settings
ALTER TABLE public.supplier_portal_settings 
ADD COLUMN IF NOT EXISTS visible_columns JSONB DEFAULT '["sku", "description", "unit", "packaging_unit", "price", "annual_order_value"]'::jsonb;