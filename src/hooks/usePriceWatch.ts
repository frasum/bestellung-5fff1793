import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PriceWatchResult {
  id: string;
  organization_id: string;
  article_id: string | null;
  article_name: string;
  article_category: string | null;
  search_query: string;
  found_price: number;
  found_supplier: string;
  source_url: string | null;
  current_price: number;
  savings_percent: number;
  savings_amount: number;
  is_dismissed: boolean;
  is_reviewed: boolean;
  notes: string | null;
  searched_at: string;
  expires_at: string;
  created_at: string;
}

export interface PriceWatchSettings {
  id: string;
  organization_id: string;
  is_enabled: boolean;
  min_savings_percent: number;
  search_radius_km: number;
  categories: string[];
  search_frequency: string;
  email_notifications: boolean;
  last_search_at: string | null;
  last_search_results_count: number | null;
}

export interface PriceWatchAlert {
  id: string;
  organization_id: string;
  user_id: string;
  result_id: string;
  is_read: boolean;
  email_sent: boolean;
  created_at: string;
}

export const usePriceWatchResults = () => {
  return useQuery({
    queryKey: ['price-watch-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_watch_results')
        .select('*')
        .order('savings_percent', { ascending: false });

      if (error) throw error;
      return data as PriceWatchResult[];
    },
  });
};

export const usePriceWatchSettings = () => {
  return useQuery({
    queryKey: ['price-watch-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_watch_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      return data as PriceWatchSettings | null;
    },
  });
};

export const usePriceWatchAlerts = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['price-watch-alerts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('price_watch_alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return data as PriceWatchAlert[];
    },
    enabled: !!user?.id,
  });
};

export const useUnreadAlertsCount = () => {
  const { data: alerts } = usePriceWatchAlerts();
  return alerts?.length || 0;
};

export const useUpdatePriceWatchSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<PriceWatchSettings> & { organization_id: string }) => {
      const { data, error } = await supabase
        .from('price_watch_settings')
        .upsert(settings, { onConflict: 'organization_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watch-settings'] });
      toast.success('Einstellungen gespeichert');
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast.error('Fehler beim Speichern');
    },
  });
};

export const useDismissResult = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from('price_watch_results')
        .update({ is_dismissed: true })
        .eq('id', resultId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watch-results'] });
      toast.success('Ergebnis ausgeblendet');
    },
  });
};

export const useMarkAsReviewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultId: string) => {
      const { error } = await supabase
        .from('price_watch_results')
        .update({ is_reviewed: true })
        .eq('id', resultId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watch-results'] });
      toast.success('Als geprüft markiert');
    },
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('price_watch_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-watch-alerts'] });
    },
  });
};

export const useRunPriceSearch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organization_id, category_filter, max_articles }: {
      organization_id: string;
      category_filter?: string;
      max_articles?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('search-price-alternatives', {
        body: { organization_id, category_filter, max_articles },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['price-watch-results'] });
      queryClient.invalidateQueries({ queryKey: ['price-watch-settings'] });
      queryClient.invalidateQueries({ queryKey: ['price-watch-alerts'] });
      
      if (data.results_count > 0) {
        toast.success(`${data.results_count} günstigere Preise gefunden!`);
      } else {
        toast.info('Keine günstigeren Preise gefunden');
      }
    },
    onError: (error) => {
      console.error('Error running price search:', error);
      toast.error('Fehler bei der Preissuche');
    },
  });
};
