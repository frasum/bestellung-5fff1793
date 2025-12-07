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

export const useOrders = (locationId?: string) => {
  return useQuery({
    queryKey: ['orders', locationId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*, suppliers(id, name, email, customer_number), order_items(*)')
        .order('created_at', { ascending: false });

      if (locationId) {
        // Show orders for this location OR orders without location (backward compatibility)
        query = query.or(`location_id.eq.${locationId},location_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Order[];
    },
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
            items: orderItems.map(item => ({
              article_name: item.article_name,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.unit_price,
              total_price: item.total_price,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`${data.deletedCount} Test-Bestellungen gelöscht`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
