import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useSuppliersRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('suppliers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suppliers',
        },
        (payload) => {
          console.log('Supplier change detected:', payload);
          // Invalidate all supplier queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          queryClient.invalidateQueries({ 
            predicate: (query) => query.queryKey[0] === 'suppliers-by-location'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
