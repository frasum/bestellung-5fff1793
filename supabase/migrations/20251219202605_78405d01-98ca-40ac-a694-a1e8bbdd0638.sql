-- Add sponsored_features column to organizations table for granular feature control
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS sponsored_features jsonb DEFAULT '{}';

-- Add comment explaining the structure
COMMENT ON COLUMN public.organizations.sponsored_features IS 'JSON object controlling which features are enabled for sponsored accounts. Keys: suppliers, articles, orders, inventory, simple_order, b2b_portal, voice_order, wine_catalog, multi_location, supplier_portal, advanced_reports';