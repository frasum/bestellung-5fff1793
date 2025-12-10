import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeLocationSupplier {
  id: string;
  employee_id: string;
  location_id: string;
  supplier_id: string;
  created_at: string;
}

export function useEmployeeLocationSuppliers(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-location-suppliers', employeeId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('employee_location_suppliers')
        .select('*');

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EmployeeLocationSupplier[];
    },
    enabled: true,
  });
}

export function useAllEmployeeLocationSuppliers() {
  return useQuery({
    queryKey: ['employee-location-suppliers-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('employee_location_suppliers')
        .select('*');

      if (error) throw error;
      return data as EmployeeLocationSupplier[];
    },
  });
}

export interface LocationSupplierAssignment {
  locationId: string;
  supplierIds: string[];
}

export function useUpdateEmployeeLocationSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      employeeId, 
      assignments 
    }: { 
      employeeId: string; 
      assignments: LocationSupplierAssignment[];
    }) => {
      // First, delete all existing assignments for this employee
      const { error: deleteError } = await supabase
        .from('employee_location_suppliers')
        .delete()
        .eq('employee_id', employeeId);

      if (deleteError) throw deleteError;

      // Then insert new assignments
      const insertData: { employee_id: string; location_id: string; supplier_id: string }[] = [];
      
      for (const assignment of assignments) {
        for (const supplierId of assignment.supplierIds) {
          insertData.push({
            employee_id: employeeId,
            location_id: assignment.locationId,
            supplier_id: supplierId,
          });
        }
      }

      if (insertData.length > 0) {
        const { error: insertError } = await supabase
          .from('employee_location_suppliers')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      return { employeeId, assignments };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-location-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['employee-location-suppliers-all'] });
    },
    onError: (error) => {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    },
  });
}
