import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  contact_person: string | null;
  customer_number: string | null;
  minimum_order_value: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  customer_number?: string;
  minimum_order_value?: number;
  is_active?: boolean;
}

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Supplier[];
    },
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SupplierInput) => {
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
        .from('suppliers')
        .insert({
          ...input,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['suppliers'] });
      const previousSuppliers = queryClient.getQueryData<Supplier[]>(['suppliers']);
      
      const optimisticSupplier: Supplier = {
        id: crypto.randomUUID(),
        organization_id: '',
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        address: input.address || null,
        contact_person: input.contact_person || null,
        customer_number: input.customer_number || null,
        minimum_order_value: input.minimum_order_value || null,
        is_active: input.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Supplier[]>(['suppliers'], (old) => {
        const updated = [...(old || []), optimisticSupplier];
        return updated.sort((a, b) => a.name.localeCompare(b.name));
      });
      
      return { previousSuppliers };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueryData(['suppliers'], context.previousSuppliers);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onSuccess: () => toast.success('Supplier created successfully'),
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<SupplierInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...input }) => {
      await queryClient.cancelQueries({ queryKey: ['suppliers'] });
      const previousSuppliers = queryClient.getQueryData<Supplier[]>(['suppliers']);
      
      queryClient.setQueryData<Supplier[]>(['suppliers'], (old) =>
        old?.map((supplier) => 
          supplier.id === id 
            ? { ...supplier, ...input, updated_at: new Date().toISOString() } 
            : supplier
        )
      );
      
      return { previousSuppliers };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueryData(['suppliers'], context.previousSuppliers);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onSuccess: () => toast.success('Lieferant erfolgreich aktualisiert'),
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === '23503') {
          throw new Error('FOREIGN_KEY_CONSTRAINT');
        }
        throw error;
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['suppliers'] });
      const previousSuppliers = queryClient.getQueryData<Supplier[]>(['suppliers']);
      
      queryClient.setQueryData<Supplier[]>(['suppliers'], (old) =>
        old?.filter((supplier) => supplier.id !== id)
      );
      
      return { previousSuppliers };
    },
    onError: (error: Error, _id, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueryData(['suppliers'], context.previousSuppliers);
      }
      if (error.message === 'FOREIGN_KEY_CONSTRAINT') {
        toast.error('Dieser Lieferant kann nicht gelöscht werden, da noch Bestellungen existieren. Möchten Sie ihn stattdessen deaktivieren?');
      } else {
        toast.error(error.message);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onSuccess: () => toast.success('Lieferant erfolgreich gelöscht'),
  });
};

export const useDeactivateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['suppliers'] });
      const previousSuppliers = queryClient.getQueryData<Supplier[]>(['suppliers']);
      
      queryClient.setQueryData<Supplier[]>(['suppliers'], (old) =>
        old?.map((supplier) => 
          supplier.id === id ? { ...supplier, is_active: false } : supplier
        )
      );
      
      return { previousSuppliers };
    },
    onError: (error: Error, _id, context) => {
      if (context?.previousSuppliers) {
        queryClient.setQueryData(['suppliers'], context.previousSuppliers);
      }
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onSuccess: () => toast.success('Lieferant erfolgreich deaktiviert'),
  });
};
