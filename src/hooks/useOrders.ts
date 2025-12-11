import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CartItem } from '@/contexts/CartContext';

export interface Order {
  id: string;
  order_number: string;
  organization_id: string;
  supplier_id: string;
  user_id: string;
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
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  article_id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  created_at: string;
}

interface CreateOrderInput {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  items: CartItem[];
  deliveryAddress: string;
  notes?: string;
  restaurantName: string;
  isTestOrder?: boolean;
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
        .select('*, suppliers(id, name, email, customer_number), order_items(*), locations(id, name, short_code)')
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

      // Create order items
      const orderItems = input.items.map((item) => ({
        order_id: order.id,
        article_id: item.article.id,
        article_name: item.article.name,
        quantity: item.quantity,
        unit: item.article.unit,
        unit_price: Number(item.article.price),
        total_price: Number(item.article.price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

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
            items: input.items.map(item => ({
              article_name: item.article.name,
              quantity: item.quantity,
              unit: item.article.unit,
              unit_price: Number(item.article.price),
              total_price: Number(item.article.price) * item.quantity,
              sku: item.article.sku || undefined,
              packaging_unit: item.article.packaging_unit || undefined,
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
    },
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} Test-Bestellungen gelöscht`);
    },
  });
};
