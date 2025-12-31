import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganization } from '@/hooks/useOrganization';

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  short_code: string | null;
  email: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationInput {
  name: string;
  short_code?: string;
  email?: string;
  is_default?: boolean;
}

export const useLocations = () => {
  const { data: organizationId } = useOrganization();

  return useQuery({
    queryKey: ['locations', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('organization_id', organizationId)
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      return data as Location[];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LocationInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // If this is set as default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from('locations')
          .update({ is_default: false })
          .eq('organization_id', profile.organization_id);
      }

      const { data, error } = await supabase
        .from('locations')
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
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Standort erstellt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<LocationInput> & { id: string }) => {
      // If setting as default, unset others first
      if (input.is_default) {
        const { data: location } = await supabase
          .from('locations')
          .select('organization_id')
          .eq('id', id)
          .single();

        if (location) {
          await supabase
            .from('locations')
            .update({ is_default: false })
            .eq('organization_id', location.organization_id);
        }
      }

      const { data, error } = await supabase
        .from('locations')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Standort aktualisiert');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast.success('Standort gelöscht');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
