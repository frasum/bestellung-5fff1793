import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MergeSuppliersParams {
  sourceId: string;
  targetId: string;
}

export function useMergeSuppliers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sourceId, targetId }: MergeSuppliersParams) => {
      const { error } = await supabase.rpc('merge_suppliers', {
        source_id: sourceId,
        target_id: targetId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-locations'] });
      queryClient.invalidateQueries({ queryKey: ['communication-logs'] });
      
      toast.success('Lieferanten erfolgreich zusammengeführt');
    },
    onError: (error: any) => {
      console.error('Error merging suppliers:', error);
      toast.error('Fehler beim Zusammenführen: ' + (error.message || 'Unbekannter Fehler'));
    },
  });
}
