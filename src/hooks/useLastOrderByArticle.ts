import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LastOrderInfo {
  quantity: number;
  date: string;
}

export function useLastOrderByArticle() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['last-order-by-article', user?.id],
    queryFn: async () => {
      // Get all order items with their order dates, ordered by most recent
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          article_id,
          quantity,
          orders!inner (
            created_at,
            status
          )
        `)
        .neq('orders.status', 'cancelled')
        .order('orders(created_at)', { ascending: false });

      if (error) throw error;

      // Group by article_id, keeping only the most recent order per article
      const lastOrderMap: Record<string, LastOrderInfo> = {};
      
      for (const item of data || []) {
        if (!lastOrderMap[item.article_id]) {
          const orderData = item.orders as unknown as { created_at: string; status: string };
          lastOrderMap[item.article_id] = {
            quantity: item.quantity,
            date: orderData.created_at,
          };
        }
      }

      return lastOrderMap;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

