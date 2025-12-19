import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EdgeFunction {
  id: string;
  function_name: string;
  label_de: string;
  label_en: string;
  is_active: boolean;
  created_at: string;
}

export const useEdgeFunctionRegistry = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['edge-function-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('edge_function_registry')
        .select('*')
        .eq('is_active', true)
        .order('function_name');

      if (error) throw error;
      return data as EdgeFunction[];
    },
  });

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('edge-function-registry-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'edge_function_registry',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['edge-function-registry'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};

export const useAddEdgeFunction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      functionName,
      labelDe,
      labelEn,
    }: {
      functionName: string;
      labelDe: string;
      labelEn: string;
    }) => {
      const { error } = await supabase
        .from('edge_function_registry')
        .insert({
          function_name: functionName,
          label_de: labelDe,
          label_en: labelEn,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edge-function-registry'] });
      toast({
        title: 'Gespeichert',
        description: 'Edge Function wurde registriert.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Edge Function konnte nicht registriert werden.',
        variant: 'destructive',
      });
      console.error('Error adding edge function:', error);
    },
  });
};

export const useRemoveEdgeFunction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (functionName: string) => {
      const { error } = await supabase
        .from('edge_function_registry')
        .update({ is_active: false })
        .eq('function_name', functionName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edge-function-registry'] });
      toast({
        title: 'Entfernt',
        description: 'Edge Function wurde deaktiviert.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Edge Function konnte nicht entfernt werden.',
        variant: 'destructive',
      });
      console.error('Error removing edge function:', error);
    },
  });
};
