-- Step 1: Add permissive RLS policy for service_role to insert article_locations
CREATE POLICY "Service role can insert article_locations"
ON public.article_locations
FOR INSERT
TO service_role
WITH CHECK (true);

-- Step 2: Backfill missing article_locations for articles created today (the 7 new ones from Mäerz invoice)
INSERT INTO public.article_locations (article_id, location_id, is_active)
SELECT a.id, l.id, true
FROM public.articles a
CROSS JOIN public.locations l
WHERE a.organization_id = l.organization_id
  AND a.created_at >= '2025-12-24 00:00:00'
  AND NOT EXISTS (
    SELECT 1 FROM public.article_locations al 
    WHERE al.article_id = a.id AND al.location_id = l.id
  );

-- Step 3: Delete one duplicate "Eurokisten E 2" (keep the first one, delete newer duplicate)
DELETE FROM public.articles
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY supplier_id, sku ORDER BY created_at ASC) as rn
    FROM public.articles
    WHERE sku = '9001'
  ) sub
  WHERE rn > 1
);