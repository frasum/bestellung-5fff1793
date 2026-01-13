import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface MergeArticlesParams {
  sourceId: string;
  targetId: string;
}

export function useMergeArticles() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ sourceId, targetId }: MergeArticlesParams) => {
      const { error } = await supabase.rpc('merge_articles', {
        source_id: sourceId,
        target_id: targetId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      
      toast.success(t('articles.mergeSuccess', 'Artikel erfolgreich zusammengeführt'));
    },
    onError: (error: any) => {
      console.error('Error merging articles:', error);
      toast.error(t('articles.mergeError', 'Fehler beim Zusammenführen') + ': ' + (error.message || 'Unbekannter Fehler'));
    },
  });
}
