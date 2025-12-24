import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PriceHistoryEntry {
  id: string;
  article_id: string;
  organization_id: string;
  old_price: number;
  new_price: number;
  changed_at: string;
  changed_by: string | null;
  change_source: string;
  invoice_id: string | null;
  order_id: string | null;
  invoices?: {
    invoice_number: string;
  } | null;
  orders?: {
    order_number: string;
  } | null;
}

export interface AllPriceHistoryEntry extends PriceHistoryEntry {
  articles?: {
    name: string;
    sku: string | null;
    category: string | null;
    supplier_id: string;
    suppliers?: {
      name: string;
    } | null;
  } | null;
}

export const usePriceHistory = (articleId: string | null) => {
  return useQuery({
    queryKey: ['price-history', articleId],
    queryFn: async () => {
      if (!articleId) return [];
      
      const { data, error } = await supabase
        .from('article_price_history')
        .select(`
          *,
          invoices(invoice_number),
          orders(order_number)
        `)
        .eq('article_id', articleId)
        .order('changed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as PriceHistoryEntry[];
    },
    enabled: !!articleId,
  });
};

export const useAllPriceHistory = () => {
  return useQuery({
    queryKey: ['price-history-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      // Get user's organization via profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('article_price_history')
        .select(`
          *,
          articles(name, sku, category, supplier_id, suppliers(name)),
          invoices(invoice_number),
          orders(order_number)
        `)
        .eq('organization_id', profile.organization_id)
        .order('changed_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as AllPriceHistoryEntry[];
    },
  });
};

export const useAddPriceHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      articleId,
      organizationId,
      oldPrice,
      newPrice,
      changeSource = 'supplier_portal',
    }: {
      articleId: string;
      organizationId: string;
      oldPrice: number;
      newPrice: number;
      changeSource?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('article_price_history')
        .insert({
          article_id: articleId,
          organization_id: organizationId,
          old_price: oldPrice,
          new_price: newPrice,
          changed_by: user?.id,
          change_source: changeSource,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price-history', variables.articleId] });
    },
  });
};
