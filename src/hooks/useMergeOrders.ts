import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MergeOrdersInput {
  targetOrderId: string;
  sourceOrderIds: string[];
  combineNotes?: boolean;
}

interface MergeOrdersResult {
  success: boolean;
  targetOrderId: string;
  mergedOrderCount: number;
  totalItemsMoved: number;
  newTotalAmount: number;
}

export function useMergeOrders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: MergeOrdersInput): Promise<MergeOrdersResult> => {
      const { data, error } = await supabase.functions.invoke('merge-orders', {
        body: input,
      });

      if (error) {
        console.error('Merge orders error:', error);
        throw new Error(error.message || 'Fehler beim Zusammenführen der Bestellungen');
      }

      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Zusammenführen der Bestellungen');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(
        `${data.mergedOrderCount} Bestellungen zusammengeführt (${data.totalItemsMoved} Artikel)`
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
