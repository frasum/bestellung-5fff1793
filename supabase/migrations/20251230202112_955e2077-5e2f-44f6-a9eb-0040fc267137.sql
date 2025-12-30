-- Create function to merge two suppliers atomically
CREATE OR REPLACE FUNCTION public.merge_suppliers(source_id uuid, target_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Move articles to target supplier
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
  
  -- Update cart items
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
$$;