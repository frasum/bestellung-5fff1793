import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WineCatalogToken {
  id: string;
  token: string;
  organization_id: string;
  employee_id: string | null;
  label: string;
  permission: 'view' | 'edit';
  pin_code: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  employee?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateWineCatalogTokenInput {
  label: string;
  permission: 'view' | 'edit';
  employee_id?: string | null;
  pin_code?: string | null;
  expires_at?: string | null;
}

export interface UpdateWineCatalogTokenInput {
  id: string;
  label?: string;
  permission?: 'view' | 'edit';
  employee_id?: string | null;
  pin_code?: string | null;
  is_active?: boolean;
  expires_at?: string | null;
}

export function useWineCatalogTokens() {
  return useQuery({
    queryKey: ['wine-catalog-tokens'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('wine_catalog_tokens')
        .select(`
          *,
          employee:employees(id, name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WineCatalogToken[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateWineCatalogToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWineCatalogTokenInput) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .single();

      if (!profile?.organization_id) {
        throw new Error('No organization found');
      }

      const { data, error } = await supabase
        .from('wine_catalog_tokens')
        .insert({
          organization_id: profile.organization_id,
          label: input.label,
          permission: input.permission,
          employee_id: input.employee_id || null,
          pin_code: input.pin_code || null,
          expires_at: input.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wine-catalog-tokens'] });
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

export function useUpdateWineCatalogToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateWineCatalogTokenInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('wine_catalog_tokens')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wine-catalog-tokens'] });
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

export function useDeleteWineCatalogToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wine_catalog_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wine-catalog-tokens'] });
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
