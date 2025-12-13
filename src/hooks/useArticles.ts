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
  top_category: string | null;
  packaging_unit?: number | null;
  order_unit_id?: string | null;
  reference_price?: number | null;
  reference_unit?: string | null;
  image_url?: string | null;
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
  order_unit_id?: string | null;
  reference_price?: number;
  reference_unit?: string;
  image_url?: string | null;
  is_active?: boolean;
}

export const useArticles = () => {
  return useQuery({
    queryKey: ['articles'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
        .select('*, suppliers(id, name, minimum_order_value)')
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['articles'] });
      const previousArticles = queryClient.getQueryData<Article[]>(['articles']);
      
      const optimisticArticle: Article = {
        id: crypto.randomUUID(),
        organization_id: '',
        supplier_id: input.supplier_id,
        name: input.name,
        description: input.description || null,
        sku: input.sku || null,
        unit: input.unit,
        price: input.price,
        category: input.category || null,
        top_category: null,
        packaging_unit: input.packaging_unit || null,
        is_active: input.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Article[]>(['articles'], (old) => {
        const updated = [...(old || []), optimisticArticle];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
      
      return { previousArticles };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(['articles'], context.previousArticles);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onSuccess: () => toast.success('Article created successfully'),
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
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey: ['articles'] });
      const previousArticles = queryClient.getQueryData<Article[]>(['articles']);
      
      queryClient.setQueryData<Article[]>(['articles'], (old) =>
        old?.map((article) => 
          article.id === id 
            ? { ...article, ...input, updated_at: new Date().toISOString() } 
            : article
        )
      );
      
      return { previousArticles };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(['articles'], context.previousArticles);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
    },
    onSuccess: () => toast.success('Article updated successfully'),
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['articles'] });
      const previousArticles = queryClient.getQueryData<Article[]>(['articles']);
      
      queryClient.setQueryData<Article[]>(['articles'], (old) =>
        old?.filter((article) => article.id !== id)
      );
      
      return { previousArticles };
    },
    onError: (error: Error, _id, context) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(['articles'], context.previousArticles);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onSuccess: () => toast.success('Article deleted successfully'),
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
    onMutate: async ({ ids, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['articles'] });
      const previousArticles = queryClient.getQueryData<Article[]>(['articles']);
      
      queryClient.setQueryData<Article[]>(['articles'], (old) =>
        old?.map((article) => 
          ids.includes(article.id) 
            ? { ...article, ...updates, updated_at: new Date().toISOString() } 
            : article
        )
      );
      
      return { previousArticles };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousArticles) {
        queryClient.setQueryData(['articles'], context.previousArticles);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
    onSuccess: (_, variables) => toast.success(`${variables.ids.length} Artikel aktualisiert`),
  });
};
