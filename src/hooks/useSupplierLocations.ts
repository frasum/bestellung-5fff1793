import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupplierLocation {
  id: string;
  supplier_id: string;
  location_id: string;
  customer_number: string | null;
  minimum_order_value: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: {
    id: string;
    name: string;
    short_code: string | null;
  };
}

export interface SupplierLocationInput {
  supplier_id: string;
  location_id: string;
  customer_number?: string;
  minimum_order_value?: number;
  is_active?: boolean;
}

export const useSupplierLocations = (supplierId?: string) => {
  return useQuery({
    queryKey: ['supplier-locations', supplierId],
    queryFn: async () => {
      let query = supabase
        .from('supplier_locations')
        .select(`
          *,
          location:locations(id, name, short_code)
        `)
        .order('created_at');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as SupplierLocation[];
    },
    enabled: true,
  });
};

export const useSupplierLocationByLocation = (supplierId: string, locationId: string) => {
  return useQuery({
    queryKey: ['supplier-location', supplierId, locationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_locations')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('location_id', locationId)
        .maybeSingle();

      if (error) throw error;
      return data as SupplierLocation | null;
    },
    enabled: !!supplierId && !!locationId,
  });
};

export const useUpsertSupplierLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SupplierLocationInput) => {
      const { data, error } = await supabase
        .from('supplier_locations')
        .upsert(input, { onConflict: 'supplier_id,location_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-locations'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-location', variables.supplier_id] });
      toast.success('Standort-Zuordnung gespeichert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteSupplierLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-locations'] });
      toast.success('Standort-Zuordnung entfernt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
