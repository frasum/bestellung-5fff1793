import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem, FreeCartItem } from '@/contexts/CartContext';

export interface Order {
  id: string;
  order_number: string;
  organization_id: string;
  supplier_id: string;
  user_id: string;
  employee_id?: string | null;
  location_id?: string | null;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  notes: string | null;
  delivery_address: string;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
  is_test_order: boolean;
  suppliers?: {
    id: string;
    name: string;
    email: string;
    customer_number?: string | null;
  };
  locations?: {
    id: string;
    name: string;
    short_code: string | null;
  } | null;
  employees?: {
    id: string;
    name: string;
  } | null;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  article_id: string;
  article_name: string;
  quantity: number;
  unit: string;
  order_unit?: string | null;
  unit_price: number;
  total_price: number;
  created_at: string;
  is_free_text_item?: boolean;
  free_text_description?: string | null;
}

interface CreateOrderInput {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  items: CartItem[];
  freeItems?: FreeCartItem[];
  deliveryAddress: string;
  notes?: string;
  restaurantName: string;
  isTestOrder?: boolean;
  locationId?: string;
  employeeId?: string | null;
  customerNumber?: string;
}

// locationId: string = filter by specific location
// locationId: null = load all orders (no location filter)
// locationId: undefined = load all orders (no location filter)
export const useOrders = (locationId?: string | null) => {
  return useQuery({
    queryKey: ['orders', locationId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, suppliers(id, name, email, customer_number), order_items(*), locations(id, name, short_code), employees(id, name)')
        .order('created_at', { ascending: false });

      if (locationId) {
        // Show ONLY orders for this specific location (strict filtering)
        query = query.eq('location_id', locationId);
      }
      // If locationId is null or undefined, load all orders without location filter

      const { data, error } = await query;

      if (error) throw error;
      return data as Order[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.organization_id) throw new Error('No organization found');

      // Generate order number
      const { data: orderNumberData, error: orderNumberError } = await supabase
        .rpc('generate_order_number');

      if (orderNumberError) throw orderNumberError;

      const totalAmount = input.items.reduce(
        (sum, item) => sum + Number(item.article.price) * item.quantity,
        0
      );

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumberData,
          organization_id: profile.organization_id,
          supplier_id: input.supplierId,
          user_id: user.id,
          location_id: input.locationId || null,
          employee_id: input.employeeId || null,
          total_amount: totalAmount,
          delivery_address: input.deliveryAddress,
          notes: input.notes || null,
          is_test_order: input.isTestOrder || false,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create confirmation token for this order
      const { data: tokenData, error: tokenError } = await supabase
        .from('order_confirmation_tokens')
        .insert({
          order_id: order.id,
        })
        .select('token')
        .single();

      if (tokenError) {
        console.error('Failed to create confirmation token:', tokenError);
      }

      // Load order units for formatting BEFORE using formatOrderUnit
      const { data: orderUnits } = await supabase
        .from('order_units')
        .select('id, name, quantity');

      const formatOrderUnit = (orderUnitId: string | null | undefined) => {
        if (!orderUnitId || !orderUnits) return undefined;
        const unit = orderUnits.find(u => u.id === orderUnitId);
        return unit ? unit.name : undefined;
      };

      // Create order items (regular articles)
      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        article_id: item.article.id,
        article_name: item.article.name,
        quantity: item.quantity,
        unit: item.article.unit,
        order_unit: formatOrderUnit(item.article.order_unit_id) || null,
        unit_price: Number(item.article.price),
        total_price: Number(item.article.price) * item.quantity,
        is_free_text_item: false,
      }));

      // Add free text items
      const freeOrderItems = (input.freeItems || []).map((item) => ({
        order_id: order.id,
        article_id: null,
        article_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: 0,
        total_price: 0,
        is_free_text_item: true,
        free_text_description: item.name,
      }));

      const allOrderItems = [...orderItems, ...freeOrderItems];

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(allOrderItems);

      if (itemsError) throw itemsError;

      // Send email notification to supplier
      try {
        const { error: emailError } = await supabase.functions.invoke('send-order-email', {
          body: {
            orderId: order.id,
            orderNumber: order.order_number,
            supplierEmail: input.supplierEmail,
            supplierName: input.supplierName,
            restaurantName: input.restaurantName,
            deliveryAddress: input.deliveryAddress,
            customerNumber: input.customerNumber,
            items: input.items.map(item => ({
              article_name: item.article.name,
              quantity: item.quantity,
              unit: item.article.unit,
              unit_price: Number(item.article.price),
              total_price: Number(item.article.price) * item.quantity,
              sku: item.article.sku || undefined,
              packaging_unit: item.article.packaging_unit || undefined,
              order_unit: formatOrderUnit(item.article.order_unit_id),
            })),
            totalAmount,
            notes: input.notes,
            confirmationToken: tokenData?.token,
          },
        });

        if (emailError) {
          console.error('Email error:', emailError);
          // Don't throw - order was created successfully
        }
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
        // Don't throw - order was created successfully
      }

      return { order, orderNumber: order.order_number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot previous value
      const previousOrders = queryClient.getQueriesData<Order[]>({ queryKey: ['orders'] });

      // Optimistically update all matching queries
      queryClient.setQueriesData<Order[]>({ queryKey: ['orders'] }, (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === orderId ? { ...order, status } : order
        );
      });

      return { previousOrders };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        context.previousOrders.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onSuccess: () => {
      toast.success('Order status updated');
    },
  });
};

export const useUpdateOrderLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, locationId }: { orderId: string; locationId: string | null }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ location_id: locationId })
        .eq('id', orderId)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Keine Berechtigung zum Aktualisieren dieser Bestellung');
      }
      return data[0];
    },
    onMutate: async ({ orderId, locationId }) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      const previousOrders = queryClient.getQueriesData<Order[]>({ queryKey: ['orders'] });

      queryClient.setQueriesData<Order[]>({ queryKey: ['orders'] }, (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === orderId ? { ...order, location_id: locationId } : order
        );
      });

      return { previousOrders };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousOrders) {
        context.previousOrders.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onSuccess: () => {
      toast.success('Standort zugewiesen');
    },
  });
};

export const useResendOrderEmail = () => {
  return useMutation({
    mutationFn: async (order: Order) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get organization info for restaurant name
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, organizations(name)')
        .eq('id', user.id)
        .single();

      const restaurantName = (profile?.organizations as { name: string } | null)?.name || 'Restaurant';

      // Get article SKUs and order_unit_id for items
      const articleIds = order.order_items?.map(item => item.article_id) || [];
      const { data: articles } = await supabase
        .from('articles')
        .select('id, sku, packaging_unit, order_unit_id')
        .in('id', articleIds);

      const articleMap = new Map(articles?.map(a => [a.id, a]) || []);

      // Load order units for formatting
      const { data: orderUnits } = await supabase
        .from('order_units')
        .select('id, name, quantity');

      const formatOrderUnit = (orderUnitId: string | null | undefined) => {
        if (!orderUnitId || !orderUnits) return undefined;
        const unit = orderUnits.find(u => u.id === orderUnitId);
        return unit ? `${unit.quantity}× ${unit.name}` : undefined;
      };

      // Check for existing valid token or create a new one
      const { data: existingToken } = await supabase
        .from('order_confirmation_tokens')
        .select('token, expires_at')
        .eq('order_id', order.id)
        .gte('expires_at', new Date().toISOString())
        .maybeSingle();

      let confirmationToken = existingToken?.token;

      // Create new token if none exists or expired
      if (!confirmationToken) {
        const { data: newToken } = await supabase
          .from('order_confirmation_tokens')
          .insert({ order_id: order.id })
          .select('token')
          .single();
        confirmationToken = newToken?.token;
      }

      // Call send-order-email edge function
      const { error } = await supabase.functions.invoke('send-order-email', {
        body: {
          orderId: order.id,
          orderNumber: order.order_number,
          supplierEmail: order.suppliers?.email,
          supplierName: order.suppliers?.name,
          restaurantName,
          deliveryAddress: order.delivery_address,
          items: order.order_items?.map(item => {
            const article = articleMap.get(item.article_id);
            return {
              article_name: item.article_name,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total_price: item.total_price,
              sku: article?.sku || undefined,
              packaging_unit: article?.packaging_unit || undefined,
              order_unit: formatOrderUnit(article?.order_unit_id),
            };
          }) || [],
          totalAmount: order.total_amount,
          notes: order.notes,
          confirmationToken,
        },
      });

      if (error) throw error;
      return order;
    },
    onSuccess: () => {
      toast.success('E-Mail wurde erneut gesendet');
    },
    onError: (error: Error) => {
      toast.error(`Fehler beim Senden: ${error.message}`);
    },
  });
};

export const useDeleteTestOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // First, get all test orders for the organization
      const { data: testOrders, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .eq('is_test_order', true);

      if (fetchError) throw fetchError;
      if (!testOrders || testOrders.length === 0) return { deletedCount: 0 };

      const orderIds = testOrders.map(o => o.id);

      // Delete confirmation tokens first
      const { error: tokenError } = await supabase
        .from('order_confirmation_tokens')
        .delete()
        .in('order_id', orderIds);

      if (tokenError) {
        console.error('Error deleting confirmation tokens:', tokenError);
      }

      // Delete communication logs for test orders (by order_id)
      const { error: commLogsError } = await supabase
        .from('communication_logs')
        .delete()
        .in('order_id', orderIds);

      if (commLogsError) {
        console.error('Error deleting communication logs:', commLogsError);
      }

      // Delete all test communication logs (by [TEST] in subject)
      const { error: testLogsError } = await supabase
        .from('communication_logs')
        .delete()
        .ilike('subject', '%[TEST]%');

      if (testLogsError) {
        console.error('Error deleting test communication logs:', testLogsError);
      }

      // Delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      // Delete orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('is_test_order', true);

      if (ordersError) throw ordersError;

      return { deletedCount: testOrders.length };
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['orders'] });

      // Snapshot previous value
      const previousOrders = queryClient.getQueriesData<Order[]>({ queryKey: ['orders'] });

      // Optimistically remove test orders
      queryClient.setQueriesData<Order[]>({ queryKey: ['orders'] }, (old) => {
        if (!old) return old;
        return old.filter((order) => !order.is_test_order);
      });

      return { previousOrders };
    },
    onError: (error: Error, _variables, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        context.previousOrders.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
    },
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} Test-Bestellungen gelöscht`);
    },
  });
};
