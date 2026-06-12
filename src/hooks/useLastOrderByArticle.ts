import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LastOrderInfo {
  quantity: number;
  date: string;
  orderedBy: string;
  orderedByEmployee: boolean;
}

export function useLastOrderByArticle() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['last-order-by-article', user?.id],
    queryFn: async () => {
      // Get all order items with their order dates and orderer info
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          article_id,
          quantity,
          orders!inner (
            created_at,
            status,
            user_id,
            employee_id
          )
        `)
        .neq('orders.status', 'cancelled')
        .order('orders(created_at)', { ascending: false });

      if (error) throw error;

      // Get all unique user_ids and employee_ids to fetch names
      const userIds = new Set<string>();
      const employeeIds = new Set<string>();
      
      for (const item of data || []) {
        const orderData = item.orders as unknown as { user_id: string | null; employee_id: string | null };
        if (orderData.user_id) userIds.add(orderData.user_id);
        if (orderData.employee_id) employeeIds.add(orderData.employee_id);
      }

      // Fetch user profiles
      const profilesMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));
        for (const p of profiles || []) {
          profilesMap[p.id] = p.full_name || 'Unbekannt';
        }
      }

      // Fetch employee names
      const employeesMap: Record<string, string> = {};
      if (employeeIds.size > 0) {
        const { data: employees } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', Array.from(employeeIds));
        for (const e of employees || []) {
          employeesMap[e.id] = e.name;
        }
      }

      // Group by article_id, keeping only the most recent order per article
      const lastOrderMap: Record<string, LastOrderInfo> = {};
      
      for (const item of data || []) {
        if (!item.article_id) continue;
        if (!lastOrderMap[item.article_id]) {
          const orderData = item.orders as unknown as { 
            created_at: string; 
            status: string;
            user_id: string | null;
            employee_id: string | null;
          };
          
          let orderedBy = 'Unbekannt';
          let orderedByEmployee = false;
          
          if (orderData.employee_id && employeesMap[orderData.employee_id]) {
            orderedBy = employeesMap[orderData.employee_id];
            orderedByEmployee = true;
          } else if (orderData.user_id && profilesMap[orderData.user_id]) {
            orderedBy = profilesMap[orderData.user_id];
          }
          
          lastOrderMap[item.article_id] = {
            quantity: item.quantity,
            date: orderData.created_at,
            orderedBy,
            orderedByEmployee,
          };
        }
      }

      return lastOrderMap;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

