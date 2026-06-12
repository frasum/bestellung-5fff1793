import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface B2BInventorySession {
  id: string;
  supplier_account_id: string;
  user_id: string;
  name: string;
  status: 'in_progress' | 'completed';
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface B2BInventoryItem {
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
    unit: string | null;
    sku: string | null;
    vendor_id: string;
    price: number | null;
    vendor?: {
      id: string;
      name: string;
    };
  };
}

export interface B2BInventorySessionWithStats extends B2BInventorySession {
  itemCount: number;
  totalValue: number;
}

export const useB2BInventorySessions = (accountId: string) => {
  return useQuery({
    queryKey: ['b2b-inventory-sessions', accountId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('b2b_inventory_sessions')
        .select('*')
        .eq('supplier_account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as B2BInventorySession[];
    },
    enabled: !!accountId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useB2BInventorySessionsWithStats = (accountId: string) => {
  return useQuery({
    queryKey: ['b2b-inventory-sessions-with-stats', accountId],
    queryFn: async () => {
      // Get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('b2b_inventory_sessions')
        .select('*')
        .eq('supplier_account_id', accountId)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        return [] as B2BInventorySessionWithStats[];
      }

      // Get all inventory items with unit prices
      const { data: allItems, error: itemsError } = await supabase
        .from('b2b_inventory_items')
        .select('session_id, storage_1, storage_2, unit_price')
        .in('session_id', sessions.map(s => s.id));

      if (itemsError) throw itemsError;

      // Calculate stats per session
      const sessionsWithStats: B2BInventorySessionWithStats[] = sessions.map(session => {
        const sessionItems = allItems?.filter(item => item.session_id === session.id) || [];
        const itemCount = sessionItems.length;
        const totalValue = sessionItems.reduce((sum, item) => {
          const quantity = (Number(item.storage_1) || 0) + (Number(item.storage_2) || 0);
          const price = Number(item.unit_price) || 0;
          return sum + (quantity * price);
        }, 0);

        return {
          ...session,
          itemCount,
          totalValue,
        } as B2BInventorySessionWithStats;
      });

      return sessionsWithStats;
    },
    enabled: !!accountId,
  });
};

export const useB2BInventorySession = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['b2b-inventory-session', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const { data, error } = await supabase
        .from('b2b_inventory_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data as B2BInventorySession | null;
    },
    enabled: !!sessionId,
  });
};

export const useB2BInventoryItems = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['b2b-inventory-items', sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const { data, error } = await supabase
        .from('b2b_inventory_items')
        .select(`
          *,
          article:b2b_supplier_vendor_articles(
            id,
            name,
            unit,
            sku,
            vendor_id,
            price,
            vendor:b2b_supplier_vendors(id, name)
          )
        `)
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as B2BInventoryItem[];
    },
    enabled: !!sessionId,
  });
};

export const useCreateB2BInventorySession = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      accountId, 
      name, 
      notes,
      supplierId 
    }: { 
      accountId: string; 
      name: string; 
      notes?: string;
      supplierId?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('b2b_inventory_sessions')
        .insert({
          name,
          notes,
          supplier_account_id: accountId,
          supplier_id: supplierId || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-sessions', variables.accountId] });
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-sessions-with-stats', variables.accountId] });
      toast.success('Inventur gestartet');
    },
    onError: () => {
      toast.error('Fehler beim Starten der Inventur');
    },
  });
};

export const useUpdateB2BInventorySession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      accountId,
      ...updates 
    }: Partial<B2BInventorySession> & { id: string; accountId: string }) => {
      const { data, error } = await supabase
        .from('b2b_inventory_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, accountId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-sessions', data.accountId] });
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-sessions-with-stats', data.accountId] });
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-session', data.id] });
    },
  });
};

export const useDeleteB2BInventorySession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, accountId }: { id: string; accountId: string }) => {
      const { error } = await supabase
        .from('b2b_inventory_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { accountId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-sessions', data.accountId] });
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-sessions-with-stats', data.accountId] });
      toast.success('Inventur gelöscht');
    },
    onError: () => {
      toast.error('Fehler beim Löschen der Inventur');
    },
  });
};

export const useBulkUpsertB2BInventoryItems = () => {
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
        .from('b2b_inventory_items')
        .upsert(itemsWithSession, { onConflict: 'session_id,article_id' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['b2b-inventory-items', variables.session_id] });
      toast.success('Inventur gespeichert');
    },
    onError: () => {
      toast.error('Fehler beim Speichern der Inventur');
    },
  });
};
