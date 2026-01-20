import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

export function useArticlesRealtime() {
  const queryClient = useQueryClient();
  const { data: organizationId } = useOrganization();

  useEffect(() => {
    if (!organizationId) return;
    
    const channel = supabase
      .channel('articles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'articles',
        },
        () => {
          // Invalidate queries with organization-specific keys
          queryClient.invalidateQueries({ queryKey: ['articles', organizationId] });
          queryClient.invalidateQueries({ queryKey: ['articles', organizationId, 'supplier'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, organizationId]);
}