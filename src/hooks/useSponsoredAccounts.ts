import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { toast } from "sonner";

export interface SponsoredAccount {
  id: string;
  name: string;
  email: string | null;
  is_sponsored: boolean;
  sponsored_note: string | null;
  is_demo: boolean;
  subscription_tier: string;
  created_at: string;
}

export function useSponsoredAccounts() {
  const { data: isSuperAdmin } = useIsSuperAdmin();

  return useQuery({
    queryKey: ['sponsored-accounts'],
    queryFn: async (): Promise<SponsoredAccount[]> => {
      // Fetch all organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, is_sponsored, sponsored_note, is_demo, subscription_tier, created_at')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Fetch admin emails for each org
      const orgsWithEmails: SponsoredAccount[] = await Promise.all(
        (orgs || []).map(async (org) => {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('email')
            .eq('organization_id', org.id)
            .limit(1);

          return {
            id: org.id,
            name: org.name,
            is_sponsored: org.is_sponsored ?? false,
            sponsored_note: org.sponsored_note,
            is_demo: org.is_demo ?? false,
            subscription_tier: org.subscription_tier ?? 'free',
            created_at: org.created_at,
            email: profiles?.[0]?.email || null,
          };
        })
      );

      return orgsWithEmails;
    },
    enabled: !!isSuperAdmin,
    staleTime: 60 * 1000,
  });
}

export function useSponsoredAccountStats() {
  const { data: accounts } = useSponsoredAccounts();

  const stats = {
    total: accounts?.length || 0,
    sponsored: accounts?.filter(a => a.is_sponsored).length || 0,
    demo: accounts?.filter(a => a.is_demo).length || 0,
    regular: accounts?.filter(a => !a.is_demo && !a.is_sponsored).length || 0,
  };

  return stats;
}

export function useSetSponsored() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      isSponsored, 
      sponsoredNote 
    }: { 
      organizationId: string; 
      isSponsored: boolean; 
      sponsoredNote?: string;
    }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          is_sponsored: isSponsored, 
          sponsored_note: sponsoredNote || null 
        })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: (_, { isSponsored }) => {
      queryClient.invalidateQueries({ queryKey: ['sponsored-accounts'] });
      toast.success(isSponsored 
        ? 'Account als Sponsored markiert' 
        : 'Sponsored-Status entfernt'
      );
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des Sponsored-Status');
      console.error(error);
    },
  });
}

export function useUpdateSponsoredNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      sponsoredNote 
    }: { 
      organizationId: string; 
      sponsoredNote: string;
    }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ sponsored_note: sponsoredNote })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsored-accounts'] });
      toast.success('Notiz aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Notiz');
      console.error(error);
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      organizationId, 
      name 
    }: { 
      organizationId: string; 
      name: string;
    }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ name })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsored-accounts'] });
      toast.success('Organisation aktualisiert');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren der Organisation');
      console.error(error);
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsored-accounts'] });
      toast.success('Organisation gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen der Organisation');
      console.error(error);
    },
  });
}
