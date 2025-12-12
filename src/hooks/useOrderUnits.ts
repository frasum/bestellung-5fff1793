import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface OrderUnit {
  id: string;
  organization_id: string;
  name: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export const useOrderUnits = () => {
  return useQuery({
    queryKey: ['order-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_units')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as OrderUnit[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useCreateOrderUnit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, quantity }: { name: string; quantity: number }) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('order_units')
        .insert({
          name,
          quantity,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-units'] });
      toast.success('Bestelleinheit hinzugefügt');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('Diese Bestelleinheit existiert bereits');
      } else {
        toast.error('Fehler beim Hinzufügen');
      }
    },
  });
};

export const useUpdateOrderUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, quantity }: { id: string; name: string; quantity: number }) => {
      const { data, error } = await supabase
        .from('order_units')
        .update({ name, quantity })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-units'] });
      toast.success('Bestelleinheit aktualisiert');
    },
    onError: () => {
      toast.error('Fehler beim Aktualisieren');
    },
  });
};

export const useDeleteOrderUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('order_units')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-units'] });
      toast.success('Bestelleinheit gelöscht');
    },
    onError: () => {
      toast.error('Fehler beim Löschen');
    },
  });
};
