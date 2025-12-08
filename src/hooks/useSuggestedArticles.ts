import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SuggestedArticle {
  id: string;
  supplier_id: string;
  organization_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  price: number;
  category: string | null;
  supplier_comment: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const useSuggestedArticles = () => {
  return useQuery({
    queryKey: ['suggested-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suggested_articles')
        .select(`
          *,
          suppliers:supplier_id (name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (SuggestedArticle & { suppliers: { name: string } | null })[];
    },
  });
};

export const useSuggestedArticlesCount = () => {
  return useQuery({
    queryKey: ['suggested-articles-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('suggested_articles')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
  });
};

export const useSuggestedArticlesBySupplier = (supplierId: string | null) => {
  return useQuery({
    queryKey: ['suggested-articles', supplierId],
    queryFn: async () => {
      if (!supplierId) return [];
      
      const { data, error } = await supabase
        .from('suggested_articles')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SuggestedArticle[];
    },
    enabled: !!supplierId,
  });
};

export const useApproveSuggestedArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestion: SuggestedArticle) => {
      // Create the real article
      const { data: newArticle, error: insertError } = await supabase
        .from('articles')
        .insert({
          supplier_id: suggestion.supplier_id,
          organization_id: suggestion.organization_id,
          name: suggestion.name,
          description: suggestion.description,
          sku: suggestion.sku,
          unit: suggestion.unit,
          price: suggestion.price,
          category: suggestion.category,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Mark suggestion as approved
      const { error: updateError } = await supabase
        .from('suggested_articles')
        .update({ 
          status: 'approved', 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', suggestion.id);

      if (updateError) throw updateError;

      return newArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-articles'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-articles-count'] });
      queryClient.invalidateQueries({ queryKey: ['combined-pending-by-supplier'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Artikel übernommen');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};

export const useRejectSuggestedArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await supabase
        .from('suggested_articles')
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString() 
        })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-articles'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-articles-count'] });
      queryClient.invalidateQueries({ queryKey: ['combined-pending-by-supplier'] });
      toast.success('Vorschlag abgelehnt');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};

export const useApproveAllSuggestedArticles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestions: SuggestedArticle[]) => {
      for (const suggestion of suggestions) {
        // Create the real article
        await supabase
          .from('articles')
          .insert({
            supplier_id: suggestion.supplier_id,
            organization_id: suggestion.organization_id,
            name: suggestion.name,
            description: suggestion.description,
            sku: suggestion.sku,
            unit: suggestion.unit,
            price: suggestion.price,
            category: suggestion.category,
            is_active: true,
          });

        // Mark suggestion as approved
        await supabase
          .from('suggested_articles')
          .update({ 
            status: 'approved', 
            reviewed_at: new Date().toISOString() 
          })
          .eq('id', suggestion.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-articles'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-articles-count'] });
      queryClient.invalidateQueries({ queryKey: ['combined-pending-by-supplier'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Alle Vorschläge übernommen');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};

export const useRejectAllSuggestedArticles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionIds: string[]) => {
      const { error } = await supabase
        .from('suggested_articles')
        .update({ 
          status: 'rejected', 
          reviewed_at: new Date().toISOString() 
        })
        .in('id', suggestionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggested-articles'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-articles-count'] });
      queryClient.invalidateQueries({ queryKey: ['combined-pending-by-supplier'] });
      toast.success('Alle Vorschläge abgelehnt');
    },
    onError: (error: any) => {
      toast.error('Fehler: ' + error.message);
    },
  });
};
