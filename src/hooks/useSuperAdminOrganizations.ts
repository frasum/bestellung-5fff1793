import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrganizationUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
}

export interface OrganizationLocation {
  id: string;
  name: string;
  short_code: string | null;
  is_default: boolean;
}

export interface OrganizationSupplier {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

export interface OrganizationOverview {
  id: string;
  name: string;
  subscription_tier: string;
  is_demo: boolean | null;
  is_sponsored: boolean;
  created_at: string;
  trial_ends_at: string | null;
  users: OrganizationUser[];
  locations: OrganizationLocation[];
  suppliers: OrganizationSupplier[];
}

export function useSuperAdminOrganizations() {
  return useQuery({
    queryKey: ['super-admin', 'organizations-overview'],
    queryFn: async () => {
      // Fetch all organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, subscription_tier, is_demo, is_sponsored, created_at, trial_ends_at')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, organization_id');

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch all locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, short_code, is_default, organization_id');

      if (locationsError) throw locationsError;

      // Fetch all suppliers
      const { data: suppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, name, email, is_active, organization_id');

      if (suppliersError) throw suppliersError;

      // Create lookup maps
      const roleMap = new Map<string, string>();
      roles?.forEach(r => roleMap.set(r.user_id, r.role));

      // Combine data
      const result: OrganizationOverview[] = (orgs || []).map(org => ({
        ...org,
        users: (profiles || [])
          .filter(p => p.organization_id === org.id)
          .map(p => ({
            id: p.id,
            email: p.email,
            full_name: p.full_name,
            role: roleMap.get(p.id) || null,
          })),
        locations: (locations || [])
          .filter(l => l.organization_id === org.id)
          .map(l => ({
            id: l.id,
            name: l.name,
            short_code: l.short_code,
            is_default: l.is_default,
          })),
        suppliers: (suppliers || [])
          .filter(s => s.organization_id === org.id)
          .map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            is_active: s.is_active,
          })),
      }));

      return result;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useMoveUserToOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, targetOrgId }: { userId: string; targetOrgId: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: targetOrgId })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'organizations-overview'] });
      toast.success('Benutzer erfolgreich verschoben');
    },
    onError: (error) => {
      console.error('Error moving user:', error);
      toast.error('Fehler beim Verschieben des Benutzers');
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      // First disconnect all profiles from this organization
      const { error: profilesError } = await supabase
        .from('profiles')
        .update({ organization_id: null })
        .eq('organization_id', orgId);

      if (profilesError) throw profilesError;

      // Then delete the organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'organizations-overview'] });
      toast.success('Organisation erfolgreich gelöscht');
    },
    onError: (error) => {
      console.error('Error deleting organization:', error);
      toast.error('Fehler beim Löschen der Organisation');
    },
  });
}

export function useSuperAdminStats() {
  const { data: organizations } = useSuperAdminOrganizations();

  if (!organizations) {
    return {
      totalOrganizations: 0,
      totalUsers: 0,
      totalLocations: 0,
      totalSuppliers: 0,
      demoOrganizations: 0,
      enterpriseOrganizations: 0,
      sponsoredOrganizations: 0,
    };
  }

  return {
    totalOrganizations: organizations.length,
    totalUsers: organizations.reduce((sum, org) => sum + org.users.length, 0),
    totalLocations: organizations.reduce((sum, org) => sum + org.locations.length, 0),
    totalSuppliers: organizations.reduce((sum, org) => sum + org.suppliers.length, 0),
    demoOrganizations: organizations.filter(org => org.is_demo).length,
    enterpriseOrganizations: organizations.filter(org => org.subscription_tier === 'enterprise').length,
    sponsoredOrganizations: organizations.filter(org => org.is_sponsored).length,
  };
}
