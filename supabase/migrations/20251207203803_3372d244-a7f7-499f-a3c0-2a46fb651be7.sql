-- Add is_test_order column to orders table
ALTER TABLE public.orders ADD COLUMN is_test_order boolean NOT NULL DEFAULT false;

-- Create RLS policy for deleting test orders (admins and managers only)
CREATE POLICY "Admins and managers can delete test orders" 
ON public.orders 
FOR DELETE 
USING (
  organization_id = get_user_organization_id(auth.uid()) 
  AND is_test_order = true 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
);

-- Also need to allow deleting order_items for test orders
CREATE POLICY "Users can delete order items for test orders" 
ON public.order_items 
FOR DELETE 
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE organization_id = get_user_organization_id(auth.uid()) 
    AND is_test_order = true
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
);

-- Also delete confirmation tokens for test orders
CREATE POLICY "Users can delete confirmation tokens for test orders" 
ON public.order_confirmation_tokens 
FOR DELETE 
USING (
  order_id IN (
    SELECT id FROM orders 
    WHERE organization_id = get_user_organization_id(auth.uid()) 
    AND is_test_order = true
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  )
);