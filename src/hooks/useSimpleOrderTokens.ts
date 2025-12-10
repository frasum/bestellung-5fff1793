import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SimpleOrderToken {
  id: string;
  token: string;
  supplier_id: string;
  location_id: string | null;
  organization_id: string;
  language: string;
  label: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  supplier?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateSimpleOrderTokenInput {
  supplier_id: string;
  location_id?: string | null;
  label: string;
  language?: string;
  expires_at?: string | null;
}

export function useSimpleOrderTokens() {
  return useQuery({
    queryKey: ['simple-order-tokens'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('simple_order_tokens')
        .select(`
          *,
          supplier:suppliers(id, name),
          location:locations(id, name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SimpleOrderToken[];
    },
  });
}

export function useCreateSimpleOrderToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSimpleOrderTokenInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      const { data, error } = await supabase
        .from('simple_order_tokens')
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
      queryClient.invalidateQueries({ queryKey: ['simple-order-tokens'] });
      toast({
        title: 'Bestelllink erstellt',
        description: 'Der QR-Code kann jetzt ausgedruckt werden.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSimpleOrderToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SimpleOrderToken> & { id: string }) => {
      const { data, error } = await supabase
        .from('simple_order_tokens')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-order-tokens'] });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSimpleOrderToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('simple_order_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-order-tokens'] });
      toast({
        title: 'Bestelllink gelöscht',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
