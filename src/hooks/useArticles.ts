import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Article {
  id: string;
  organization_id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  price: number;
  category: string | null;
  packaging_unit?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    name: string;
    minimum_order_value: number | null;
  };
}

export interface ArticleInput {
  supplier_id: string;
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  price: number;
  category?: string;
  packaging_unit?: number;
  is_active?: boolean;
}

export const useArticles = () => {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*, suppliers(id, name, minimum_order_value)')
        .order('name');

      if (error) throw error;
      return data as Article[];
    },
  });
};

export const useArticlesBySupplier = (supplierId: string | null) => {
  return useQuery({
    queryKey: ['articles', 'supplier', supplierId],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*, suppliers(id, name, minimum_order_value)')
        .eq('is_active', true)
        .order('name');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Article[];
    },
    enabled: true,
  });
};

export const useCreateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ArticleInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...input,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ArticleInput> & { id: string }) => {
      // If price is being updated, first get the current price for history
      if (input.price !== undefined) {
        const { data: currentArticle } = await supabase
          .from('articles')
          .select('price, organization_id')
          .eq('id', id)
          .single();

        if (currentArticle && currentArticle.price !== input.price) {
          // Record price history
          await supabase
            .from('article_price_history')
            .insert({
              article_id: id,
              organization_id: currentArticle.organization_id,
              old_price: currentArticle.price,
              new_price: input.price,
              change_source: 'manual',
            });
        }
      }

      const { data, error } = await supabase
        .from('articles')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      toast.success('Article updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success('Article deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useBulkUpdateArticles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Partial<ArticleInput> }) => {
      const { error } = await supabase
        .from('articles')
        .update(updates)
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(`${variables.ids.length} Artikel aktualisiert`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
