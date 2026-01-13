-- Create function to merge articles within the same supplier
CREATE OR REPLACE FUNCTION public.merge_articles(source_id uuid, target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_article RECORD;
  target_article RECORD;
BEGIN
  -- Verify both articles exist
  SELECT * INTO source_article FROM articles WHERE id = source_id;
  SELECT * INTO target_article FROM articles WHERE id = target_id;
  
  IF source_article IS NULL THEN
    RAISE EXCEPTION 'Source article not found';
  END IF;
  
  IF target_article IS NULL THEN
    RAISE EXCEPTION 'Target article not found';
  END IF;
  
  -- Verify articles belong to the same supplier
  IF source_article.supplier_id != target_article.supplier_id THEN
    RAISE EXCEPTION 'Articles must belong to the same supplier';
  END IF;
  
  -- Verify articles belong to the same organization
  IF source_article.organization_id != target_article.organization_id THEN
    RAISE EXCEPTION 'Articles must belong to the same organization';
  END IF;

  -- Update order_items to point to target article
  UPDATE order_items SET article_id = target_id WHERE article_id = source_id;
  
  -- Update article_price_history (merge price histories)
  UPDATE article_price_history SET article_id = target_id WHERE article_id = source_id;
  
  -- Update inventory_items
  UPDATE inventory_items SET article_id = target_id WHERE article_id = source_id;
  
  -- Update active_cart_items
  UPDATE active_cart_items SET article_id = target_id WHERE article_id = source_id;
  
  -- Update cart_draft_items
  UPDATE cart_draft_items SET article_id = target_id WHERE article_id = source_id;
  
  -- Delete article_locations for source (would conflict with target)
  DELETE FROM article_locations WHERE article_id = source_id;
  
  -- Delete employee_article_favorites for source (avoid duplicates)
  DELETE FROM employee_article_favorites WHERE article_id = source_id;
  
  -- Update invoice_items
  UPDATE invoice_items SET matched_article_id = target_id WHERE matched_article_id = source_id;
  
  -- Update supplier_article_changes
  UPDATE supplier_article_changes SET article_id = target_id WHERE article_id = source_id;
  
  -- Update price_watch_results
  UPDATE price_watch_results SET article_id = target_id WHERE article_id = source_id;
  
  -- Delete the source article
  DELETE FROM articles WHERE id = source_id;
END;
$$;