import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';

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
  origin_country: string | null;
  supplier_comment: string | null;
  status: string;
  source: string | null;
  employee_id: string | null;
  order_id: string | null;
  location_id: string | null;
  image_url: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export const useSuggestedArticles = (sourceFilter?: 'all' | 'supplier' | 'employee' | 'employee_photo') => {
  const { data: organizationId } = useOrganization();

  return useQuery({
    queryKey: ['suggested-articles', organizationId, sourceFilter],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from('suggested_articles')
        .select(`
          *,
          suppliers:supplier_id (name),
          employees:employee_id (name)
        `)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (sourceFilter && sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (SuggestedArticle & { 
        suppliers: { name: string } | null;
        employees: { name: string } | null;
      })[];
    },
    enabled: !!organizationId,
  });
};

export const useSuggestedArticlesCount = () => {
  const { data: organizationId } = useOrganization();

  return useQuery({
    queryKey: ['suggested-articles-count', organizationId],
    queryFn: async () => {
      if (!organizationId) return 0;

      const { count, error } = await supabase
        .from('suggested_articles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organizationId,
  });
};

export const useSuggestedArticlesBySupplier = (supplierId: string | null) => {
  const { data: organizationId } = useOrganization();

  return useQuery({
    queryKey: ['suggested-articles', organizationId, 'supplier', supplierId],
    queryFn: async () => {
      if (!supplierId || !organizationId) return [];
      
      const { data, error } = await supabase
        .from('suggested_articles')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SuggestedArticle[];
    },
    enabled: !!supplierId && !!organizationId,
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
          origin_country: suggestion.origin_country,
          image_url: suggestion.image_url, // Include image if available
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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error('Fehler: ' + message);
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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error('Fehler: ' + message);
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
            origin_country: suggestion.origin_country,
            image_url: suggestion.image_url, // Include image if available
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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error('Fehler: ' + message);
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
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error('Fehler: ' + message);
    },
  });
};
