import { supabase } from '@/integrations/supabase/client';

/**
 * Cached organization ID lookup for the current user.
 * Use this in mutation functions where you need the organization ID.
 */
export async function getCurrentUserOrganizationId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
    
  return profile?.organization_id ?? null;
}

/**
 * Get the organization ID or throw an error.
 * Use this when organization ID is required (e.g., in mutations).
 */
export async function requireOrganizationId(): Promise<string> {
  const orgId = await getCurrentUserOrganizationId();
  if (!orgId) throw new Error('No organization found');
  return orgId;
}

/**
 * Get the current authenticated user or throw an error.
 */
export async function requireAuthenticatedUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user;
}
