-- Fix merge_suppliers function: correct table name from supplier_changes to supplier_article_changes
CREATE OR REPLACE FUNCTION public.merge_suppliers(source_id uuid, target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_art RECORD;
  target_art_id uuid;
BEGIN
  -- Verify both suppliers exist and belong to same organization
  IF NOT EXISTS (
    SELECT 1 FROM suppliers s1 
    JOIN suppliers s2 ON s1.organization_id = s2.organization_id
    WHERE s1.id = source_id AND s2.id = target_id
  ) THEN
    RAISE EXCEPTION 'Invalid supplier IDs or suppliers belong to different organizations';
  END IF;

  -- Handle duplicate articles (same SKU) - update references first, then delete
  FOR source_art IN 
    SELECT sa.id as source_article_id, ta.id as target_article_id
    FROM articles sa
    JOIN articles ta ON sa.sku = ta.sku AND ta.supplier_id = target_id
    WHERE sa.supplier_id = source_id AND sa.sku IS NOT NULL AND sa.sku != ''
  LOOP
    -- Update order_items to point to target article
    UPDATE order_items SET article_id = source_art.target_article_id 
    WHERE article_id = source_art.source_article_id;
    
    -- Update article_price_history
    UPDATE article_price_history SET article_id = source_art.target_article_id 
    WHERE article_id = source_art.source_article_id;
    
    -- Update inventory_items
    UPDATE inventory_items SET article_id = source_art.target_article_id 
    WHERE article_id = source_art.source_article_id;
    
    -- Update active_cart_items
    UPDATE active_cart_items SET article_id = source_art.target_article_id 
    WHERE article_id = source_art.source_article_id;
    
    -- Update cart_draft_items
    UPDATE cart_draft_items SET article_id = source_art.target_article_id 
    WHERE article_id = source_art.source_article_id;
    
    -- Delete article_locations for source article (would conflict)
    DELETE FROM article_locations WHERE article_id = source_art.source_article_id;
    
    -- Delete employee_article_favorites for source article
    DELETE FROM employee_article_favorites WHERE article_id = source_art.source_article_id;
    
    -- Delete the duplicate source article
    DELETE FROM articles WHERE id = source_art.source_article_id;
  END LOOP;

  -- Move remaining articles (non-duplicates) to target supplier
  UPDATE articles SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update orders to point to target supplier
  UPDATE orders SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update invoices to point to target supplier
  UPDATE invoices SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update communication_logs to point to target supplier
  UPDATE communication_logs SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Merge supplier_locations (delete duplicates, move rest)
  DELETE FROM supplier_locations 
  WHERE supplier_id = source_id 
  AND location_id IN (SELECT location_id FROM supplier_locations WHERE supplier_id = target_id);
  
  UPDATE supplier_locations SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update active_cart_items supplier references
  UPDATE active_cart_items SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update cart_draft_items supplier references
  UPDATE cart_draft_items SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Merge employee_location_suppliers (delete duplicates, move rest)
  DELETE FROM employee_location_suppliers 
  WHERE supplier_id = source_id 
  AND (employee_id, location_id) IN (
    SELECT employee_id, location_id FROM employee_location_suppliers WHERE supplier_id = target_id
  );
  
  UPDATE employee_location_suppliers SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update suggested_articles
  UPDATE suggested_articles SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update supplier_portal_tokens
  UPDATE supplier_portal_tokens SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Update supplier_article_changes (CORRECTED table name)
  UPDATE supplier_article_changes SET supplier_id = target_id WHERE supplier_id = source_id;

  -- Delete the source supplier
  DELETE FROM suppliers WHERE id = source_id;
END;
$$;