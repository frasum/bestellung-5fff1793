import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface InventorySession {
  id: string;
  organization_id: string;
  user_id: string;
  name: string;
  status: 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface InventoryItem {
  id: string;
  session_id: string;
  article_id: string;
  storage_1: number;
  storage_2: number;
  total: number;
  unit_price?: number;
  created_at: string;
  updated_at: string;
  article?: {
    id: string;
    name: string;
    unit: string;
    sku: string | null;
    supplier_id: string;
    supplier?: {
      id: string;
      name: string;
    };
  };
}

export interface InventorySessionWithStats extends InventorySession {
  itemCount: number;
  totalValue: number;
}

export const useInventorySessions = () => {
  return useQuery({
    queryKey: ['inventory-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventorySession[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useInventorySessionsWithStats = () => {
  return useQuery({
    queryKey: ['inventory-sessions-with-stats'],
    queryFn: async () => {
      // Get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('inventory_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get all inventory items with unit prices
      const { data: allItems, error: itemsError } = await supabase
        .from('inventory_items')
        .select('session_id, storage_1, storage_2, unit_price');

      if (itemsError) throw itemsError;

      // Calculate stats per session
      const sessionsWithStats: InventorySessionWithStats[] = (sessions || []).map(session => {
        const sessionItems = allItems?.filter(item => item.session_id === session.id) || [];
        const itemCount = sessionItems.length;
        const totalValue = sessionItems.reduce((sum, item) => {
          const quantity = (item.storage_1 || 0) + (item.storage_2 || 0);
          const price = item.unit_price || 0;
          return sum + (quantity * price);
        }, 0);

        return {
          ...session,
          itemCount,
          totalValue,
        } as InventorySessionWithStats;
      });

      return sessionsWithStats;
    },
  });
};

export const useInventorySession = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['inventory-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from('inventory_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data as InventorySession | null;
    },
    enabled: !!sessionId,
  });
};

export const useInventoryItems = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['inventory-items', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          article:articles(
            id,
            name,
            unit,
            sku,
            supplier_id,
            price,
            supplier:suppliers(id, name)
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as InventoryItem[];
    },
    enabled: !!sessionId,
  });
};

export const useCreateInventorySession = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, notes }: { name: string; notes?: string }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('inventory_sessions')
        .insert({
          name,
          notes,
          organization_id: profile.organization_id,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      toast.success('Inventur gestartet');
    },
    onError: () => {
      toast.error('Fehler beim Starten der Inventur');
    },
  });
};

export const useUpdateInventorySession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InventorySession> & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-session', data.id] });
    },
  });
};

export const useDeleteInventorySession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] });
      toast.success('Inventur gelöscht');
    },
    onError: () => {
      toast.error('Fehler beim Löschen der Inventur');
    },
  });
};

export const useUpsertInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      session_id,
      article_id,
      storage_1,
      storage_2,
      unit_price,
    }: {
      session_id: string;
      article_id: string;
      storage_1: number;
      storage_2: number;
      unit_price?: number;
    }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .upsert(
          { session_id, article_id, storage_1, storage_2, unit_price },
          { onConflict: 'session_id,article_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items', variables.session_id] });
    },
  });
};

export const useBulkUpsertInventoryItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      session_id,
      items,
    }: {
      session_id: string;
      items: { article_id: string; storage_1: number; storage_2: number; unit_price?: number }[];
    }) => {
      const itemsWithSession = items.map((item) => ({
        ...item,
        session_id,
      }));

      const { data, error } = await supabase
        .from('inventory_items')
        .upsert(itemsWithSession, { onConflict: 'session_id,article_id' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items', variables.session_id] });
      toast.success('Inventur gespeichert');
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Inventur');
    },
  });
};
