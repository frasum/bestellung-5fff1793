import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeLocation {
  id: string;
  employee_id: string;
  location_id: string;
  created_at: string;
}

export function useEmployeeLocations(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-locations', employeeId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('employee_locations')
        .select('*');

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmployeeLocation[];
    },
    enabled: true,
  });
}

export function useAllEmployeeLocations() {
  return useQuery({
    queryKey: ['employee-locations-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('employee_locations')
        .select('*');

      if (error) throw error;
      return data as EmployeeLocation[];
    },
  });
}

export function useUpdateEmployeeLocations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, locationIds }: { employeeId: string; locationIds: string[] }) => {
      // First, delete all existing locations for this employee
      const { error: deleteError } = await supabase
        .from('employee_locations')
        .delete()
        .eq('employee_id', employeeId);

      if (deleteError) throw deleteError;

      // Then insert new locations if any
      if (locationIds.length > 0) {
        const insertData = locationIds.map(locationId => ({
          employee_id: employeeId,
          location_id: locationId,
        }));

        const { error: insertError } = await supabase
          .from('employee_locations')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      return { employeeId, locationIds };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-locations'] });
      queryClient.invalidateQueries({ queryKey: ['employee-locations-all'] });
    },
    onError: (error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    },
  });
}
