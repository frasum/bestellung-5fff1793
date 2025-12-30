-- Update merge_suppliers function to handle duplicate articles based on SKU
CREATE OR REPLACE FUNCTION public.merge_suppliers(source_id uuid, target_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  source_org_id uuid;
  target_org_id uuid;
BEGIN
  -- Validate that both suppliers exist and belong to the same organization
  SELECT organization_id INTO source_org_id FROM suppliers WHERE id = source_id;
  SELECT organization_id INTO target_org_id FROM suppliers WHERE id = target_id;
  
  IF source_org_id IS NULL THEN
    RAISE EXCEPTION 'Source supplier not found';
  END IF;
  
  IF target_org_id IS NULL THEN
    RAISE EXCEPTION 'Target supplier not found';
  END IF;
  
  IF source_org_id != target_org_id THEN
    RAISE EXCEPTION 'Suppliers must belong to the same organization';
  END IF;
  
  IF source_id = target_id THEN
    RAISE EXCEPTION 'Source and target supplier cannot be the same';
  END IF;

  -- STEP 1: Handle duplicate articles (same SKU)
  -- First, update order_items to point to target articles for duplicates
  UPDATE order_items oi
  SET article_id = target_art.id
  FROM articles source_art
  JOIN articles target_art ON LOWER(TRIM(source_art.sku)) = LOWER(TRIM(target_art.sku))
    AND target_art.supplier_id = target_id
    AND target_art.sku IS NOT NULL AND target_art.sku != ''
  WHERE oi.article_id = source_art.id
    AND source_art.supplier_id = source_id
    AND source_art.sku IS NOT NULL AND source_art.sku != '';

  -- Update price history references for duplicates
  UPDATE article_price_history aph
  SET article_id = target_art.id
  FROM articles source_art
  JOIN articles target_art ON LOWER(TRIM(source_art.sku)) = LOWER(TRIM(target_art.sku))
    AND target_art.supplier_id = target_id
    AND target_art.sku IS NOT NULL AND target_art.sku != ''
  WHERE aph.article_id = source_art.id
    AND source_art.supplier_id = source_id
    AND source_art.sku IS NOT NULL AND source_art.sku != '';

  -- Update inventory_items references for duplicates
  UPDATE inventory_items ii
  SET article_id = target_art.id
  FROM articles source_art
  JOIN articles target_art ON LOWER(TRIM(source_art.sku)) = LOWER(TRIM(target_art.sku))
    AND target_art.supplier_id = target_id
    AND target_art.sku IS NOT NULL AND target_art.sku != ''
  WHERE ii.article_id = source_art.id
    AND source_art.supplier_id = source_id
    AND source_art.sku IS NOT NULL AND source_art.sku != '';

  -- Update article_locations references for duplicates (avoid conflicts)
  DELETE FROM article_locations 
  WHERE article_id IN (
    SELECT source_art.id 
    FROM articles source_art
    JOIN articles target_art ON LOWER(TRIM(source_art.sku)) = LOWER(TRIM(target_art.sku))
      AND target_art.supplier_id = target_id
      AND target_art.sku IS NOT NULL AND target_art.sku != ''
    WHERE source_art.supplier_id = source_id
      AND source_art.sku IS NOT NULL AND source_art.sku != ''
  );

  -- Update cart items references for duplicates
  UPDATE active_cart_items aci
  SET article_id = target_art.id
  FROM articles source_art
  JOIN articles target_art ON LOWER(TRIM(source_art.sku)) = LOWER(TRIM(target_art.sku))
    AND target_art.supplier_id = target_id
    AND target_art.sku IS NOT NULL AND target_art.sku != ''
  WHERE aci.article_id = source_art.id
    AND source_art.supplier_id = source_id
    AND source_art.sku IS NOT NULL AND source_art.sku != '';

  UPDATE cart_draft_items cdi
  SET article_id = target_art.id
  FROM articles source_art
  JOIN articles target_art ON LOWER(TRIM(source_art.sku)) = LOWER(TRIM(target_art.sku))
    AND target_art.supplier_id = target_id
    AND target_art.sku IS NOT NULL AND target_art.sku != ''
  WHERE cdi.article_id = source_art.id
    AND source_art.supplier_id = source_id
    AND source_art.sku IS NOT NULL AND source_art.sku != '';

  -- Update employee favorites for duplicates
  DELETE FROM employee_article_favorites 
  WHERE article_id IN (
    SELECT source_art.id 
    FROM articles source_art
    JOIN articles target_art ON LOWER(TRIM(source_art.sku)) = LOWER(TRIM(target_art.sku))
      AND target_art.supplier_id = target_id
      AND target_art.sku IS NOT NULL AND target_art.sku != ''
    WHERE source_art.supplier_id = source_id
      AND source_art.sku IS NOT NULL AND source_art.sku != ''
  );

  -- Now delete duplicate articles from source (those with matching SKU at target)
  DELETE FROM articles 
  WHERE supplier_id = source_id 
    AND sku IS NOT NULL 
    AND sku != ''
    AND LOWER(TRIM(sku)) IN (
      SELECT LOWER(TRIM(sku)) 
      FROM articles 
      WHERE supplier_id = target_id 
        AND sku IS NOT NULL 
        AND sku != ''
    );

  -- STEP 2: Move remaining (non-duplicate) articles to target supplier
  UPDATE articles SET supplier_id = target_id WHERE supplier_id = source_id;
  
  -- Update orders
  UPDATE orders SET supplier_id = target_id WHERE supplier_id = source_id;
  
  -- Update invoices
  UPDATE invoices SET supplier_id = target_id WHERE supplier_id = source_id;
  
  -- Update communication logs
  UPDATE communication_logs SET supplier_id = target_id WHERE supplier_id = source_id;
  
  -- Merge supplier_locations (avoid duplicates)
  UPDATE supplier_locations SET supplier_id = target_id 
  WHERE supplier_id = source_id 
  AND location_id NOT IN (SELECT location_id FROM supplier_locations WHERE supplier_id = target_id);
  DELETE FROM supplier_locations WHERE supplier_id = source_id;
  
  -- Update cart items (supplier reference)
  UPDATE active_cart_items SET supplier_id = target_id WHERE supplier_id = source_id;
  UPDATE cart_draft_items SET supplier_id = target_id WHERE supplier_id = source_id;
  
  -- Merge employee_location_suppliers (avoid duplicates)
  UPDATE employee_location_suppliers SET supplier_id = target_id 
  WHERE supplier_id = source_id
  AND (employee_id, location_id) NOT IN (
    SELECT employee_id, location_id FROM employee_location_suppliers WHERE supplier_id = target_id
  );
  DELETE FROM employee_location_suppliers WHERE supplier_id = source_id;
  
  -- Move suggested articles
  UPDATE suggested_articles SET supplier_id = target_id WHERE supplier_id = source_id;
  
  -- Deactivate portal tokens for source supplier
  UPDATE supplier_portal_tokens SET is_active = false WHERE supplier_id = source_id;
  
  -- Move supplier changes
  UPDATE supplier_changes SET supplier_id = target_id WHERE supplier_id = source_id;
  
  -- Delete source supplier
  DELETE FROM suppliers WHERE id = source_id;
END;
$function$;