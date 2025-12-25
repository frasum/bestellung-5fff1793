import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Custom hook to get the current user's organization ID.
 * Uses React Query for caching - organization ID rarely changes.
 * 
 * Usage:
 * const { data: organizationId, isLoading } = useOrganization();
 */
export function useOrganization() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['organization', user?.id],
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes - organization rarely changes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();
      
      if (error) throw error;
      return data?.organization_id as string | null;
    },
  });
}

/**
 * Hook that returns organization ID and throws if not available.
 * Useful for components that require organization context.
 */
export function useRequireOrganization() {
  const query = useOrganization();
  
  if (query.isSuccess && !query.data) {
    throw new Error('No organization found for user');
  }
  
  return query;
}
