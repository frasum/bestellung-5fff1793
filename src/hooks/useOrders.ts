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
  suppliers?: {
    id: string;
    name: string;
    email: string;
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
}

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, suppliers(id, name, email), order_items(*)')
        .order('created_at', { ascending: false });

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
        })
        .select()
        .single();

      if (orderError) throw orderError;

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
