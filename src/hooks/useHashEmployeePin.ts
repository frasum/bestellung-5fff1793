import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HashPinInput {
  employeeId: string;
  pin: string | null;
}

export function useHashEmployeePin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, pin }: HashPinInput) => {
      const { data, error } = await supabase.functions.invoke('hash-employee-pin', {
        body: { employeeId, pin },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to update PIN');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      toast({ 
        title: 'Fehler', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });
}
