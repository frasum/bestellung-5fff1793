import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SimpleOrderToken {
  id: string;
  token: string;
  supplier_id: string | null;
  location_id: string | null;
  organization_id: string;
  language: string;
  label: string;
  is_active: boolean;
  is_multi_supplier: boolean;
  employee_name: string | null;
  employee_id: string | null;
  created_at: string;
  expires_at: string | null;
  supplier?: {
    id: string;
    name: string;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
  employee?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
  token_suppliers?: {
    supplier_id: string;
    supplier: {
      id: string;
      name: string;
    };
  }[];
}

export interface CreateSimpleOrderTokenInput {
  supplier_id?: string | null;
  supplier_ids?: string[];
  location_id?: string | null;
  label: string;
  language?: string;
  expires_at?: string | null;
  is_multi_supplier?: boolean;
  employee_name?: string | null;
  employee_id?: string | null;
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
          location:locations(id, name),
          employee:employees(id, name, phone, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For multi-supplier tokens, fetch the linked suppliers
      const tokensWithSuppliers = await Promise.all(
        (data || []).map(async (token) => {
          if (token.is_multi_supplier) {
            const { data: tokenSuppliers } = await supabase
              .from('simple_order_token_suppliers')
              .select(`
                supplier_id,
                supplier:suppliers(id, name)
              `)
              .eq('token_id', token.id);
            
            return {
              ...token,
              token_suppliers: tokenSuppliers || [],
            };
          }
          return token;
        })
      );

      return tokensWithSuppliers as SimpleOrderToken[];
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

      const isMultiSupplier = input.is_multi_supplier || (input.supplier_ids && input.supplier_ids.length > 0);

      // Create the token
      const { data: token, error } = await supabase
        .from('simple_order_tokens')
        .insert({
          supplier_id: isMultiSupplier ? null : input.supplier_id,
          location_id: input.location_id || null,
          label: input.label,
          language: input.language || 'de',
          expires_at: input.expires_at || null,
          organization_id: profile.organization_id,
          is_multi_supplier: isMultiSupplier,
          employee_name: input.employee_name || null,
          employee_id: input.employee_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // If multi-supplier, create the junction table entries
      if (isMultiSupplier && input.supplier_ids && input.supplier_ids.length > 0) {
        const tokenSupplierEntries = input.supplier_ids.map(supplierId => ({
          token_id: token.id,
          supplier_id: supplierId,
        }));

        const { error: junctionError } = await supabase
          .from('simple_order_token_suppliers')
          .insert(tokenSupplierEntries);

        if (junctionError) {
          // Rollback: delete the token if junction insert fails
          await supabase.from('simple_order_tokens').delete().eq('id', token.id);
          throw junctionError;
        }
      }

      return token;
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

export interface UpdateSimpleOrderTokenInput {
  id: string;
  label?: string;
  language?: string;
  location_id?: string | null;
  is_active?: boolean;
  supplier_id?: string | null;
  supplier_ids?: string[];
  is_multi_supplier?: boolean;
  employee_name?: string | null;
  employee_id?: string | null;
}

export function useUpdateSimpleOrderToken() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, supplier_ids, ...updates }: UpdateSimpleOrderTokenInput) => {
      // Update the token itself
      const { data, error } = await supabase
        .from('simple_order_tokens')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // If supplier_ids is provided, update the junction table
      if (supplier_ids !== undefined) {
        // Delete existing supplier links
        await supabase
          .from('simple_order_token_suppliers')
          .delete()
          .eq('token_id', id);

        // Insert new supplier links
        if (supplier_ids.length > 0) {
          const tokenSupplierEntries = supplier_ids.map(supplierId => ({
            token_id: id,
            supplier_id: supplierId,
          }));

          const { error: junctionError } = await supabase
            .from('simple_order_token_suppliers')
            .insert(tokenSupplierEntries);

          if (junctionError) throw junctionError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simple-order-tokens'] });
      toast({
        title: 'Bestelllink aktualisiert',
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
