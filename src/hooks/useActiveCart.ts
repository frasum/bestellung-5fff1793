import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, FreeCartItem } from '@/contexts/CartContext';
import { Article } from '@/hooks/useArticles';

interface ActiveCartData {
  items: CartItem[];
  freeItems: FreeCartItem[];
  deliveryDate: Date | null;
  timeWindow: string | null;
  locationId: string | null;
  employeeId: string | null;
}

export const useActiveCart = () => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadCart = useCallback(async (userId: string, organizationId: string): Promise<ActiveCartData | null> => {
    try {
      // Fetch the active cart
      const { data: cart, error: cartError } = await supabase
        .from('active_carts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (cartError) {
        console.error('Error loading cart:', cartError);
        return null;
      }

      if (!cart) {
        return null;
      }

      // Fetch cart items with article details
      const { data: cartItems, error: itemsError } = await supabase
        .from('active_cart_items')
        .select(`
          id,
          article_id,
          quantity,
          is_free_text_item,
          free_text_name,
          free_text_unit,
          supplier_id,
          article:articles(
            id,
            name,
            description,
            unit,
            price,
            category,
            supplier_id,
            sku,
            is_active,
            image_url,
            order_unit_id,
            organization_id,
            packaging_unit,
            reference_price,
            reference_unit,
            selling_price,
            sort_order,
            top_category,
            origin_country,
            grape_variety,
            flavor_profile,
            food_pairings,
            annual_order_value
          )
        `)
        .eq('cart_id', cart.id);

      if (itemsError) {
        console.error('Error loading cart items:', itemsError);
        return null;
      }

      // Separate regular items and free text items
      const regularItems: CartItem[] = [];
      const freeItems: FreeCartItem[] = [];

      (cartItems || []).forEach(item => {
        if (item.is_free_text_item && item.free_text_name) {
          freeItems.push({
            id: item.id,
            name: item.free_text_name,
            unit: item.free_text_unit || 'Stk',
            quantity: item.quantity,
            supplier_id: item.supplier_id || '',
          });
        } else if (item.article) {
          regularItems.push({
            article: item.article as unknown as Article,
            quantity: item.quantity,
          });
        }
      });

      return {
        items: regularItems,
        freeItems,
        deliveryDate: cart.delivery_date ? new Date(cart.delivery_date) : null,
        timeWindow: cart.time_window,
        locationId: cart.location_id,
        employeeId: cart.employee_id,
      };
    } catch (error) {
      console.error('Error in loadCart:', error);
      return null;
    }
  }, []);

  const saveCart = useCallback(async (
    userId: string,
    organizationId: string,
    items: CartItem[],
    freeItems: FreeCartItem[],
    deliveryDate: Date | null,
    timeWindow: string | null,
    locationId: string | null,
    employeeId: string | null
  ): Promise<boolean> => {
    try {
      // Upsert the cart
      const { data: cart, error: cartError } = await supabase
        .from('active_carts')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          delivery_date: deliveryDate?.toISOString().split('T')[0] || null,
          time_window: timeWindow,
          location_id: locationId,
          employee_id: employeeId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select('id')
        .single();

      if (cartError) {
        console.error('Error saving cart:', cartError);
        return false;
      }

      // Delete existing items
      await supabase
        .from('active_cart_items')
        .delete()
        .eq('cart_id', cart.id);

      // Insert new items
      const itemsToInsert = [
        ...items.map(item => ({
          cart_id: cart.id,
          article_id: item.article.id,
          quantity: item.quantity,
          is_free_text_item: false,
          free_text_name: null,
          free_text_unit: null,
          supplier_id: item.article.supplier_id,
        })),
        ...freeItems.map(item => ({
          cart_id: cart.id,
          article_id: null,
          quantity: item.quantity,
          is_free_text_item: true,
          free_text_name: item.name,
          free_text_unit: item.unit,
          supplier_id: item.supplier_id || null,
        })),
      ];

      if (itemsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('active_cart_items')
          .insert(itemsToInsert);

        if (insertError) {
          console.error('Error inserting cart items:', insertError);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error in saveCart:', error);
      return false;
    }
  }, []);

  const clearSavedCart = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('active_carts')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing cart:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in clearSavedCart:', error);
      return false;
    }
  }, []);

  const debouncedSave = useCallback((
    userId: string,
    organizationId: string,
    items: CartItem[],
    freeItems: FreeCartItem[],
    deliveryDate: Date | null,
    timeWindow: string | null,
    locationId: string | null,
    employeeId: string | null,
    delay: number = 500
  ) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveCart(userId, organizationId, items, freeItems, deliveryDate, timeWindow, locationId, employeeId);
    }, delay);
  }, [saveCart]);

  return {
    loadCart,
    saveCart,
    clearSavedCart,
    debouncedSave,
  };
};
