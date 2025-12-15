import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CommunicationLog {
  id: string;
  organization_id: string;
  email_type: string;
  direction: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  order_id: string | null;
  supplier_id: string | null;
  employee_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
  body_html: string | null;
}

export function useCommunicationLogs(filter?: string) {
  return useQuery({
    queryKey: ['communication-logs', filter],
    queryFn: async () => {
      let query = supabase
        .from('communication_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter && filter !== 'all') {
        query = query.eq('email_type', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching communication logs:', error);
        throw error;
      }

      return data as CommunicationLog[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
