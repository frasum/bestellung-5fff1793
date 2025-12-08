import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  created_at: string;
  demo_expires_at: string | null;
  is_expired: boolean;
}

export function useDemoAccounts() {
  return useQuery({
    queryKey: ['demo-accounts'],
    queryFn: async () => {
      // Get all demo organizations with their admin user email
      const { data: organizations, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name, created_at, demo_expires_at')
        .eq('is_demo', true)
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      // Get profile emails for each organization
      const demoAccounts: DemoAccount[] = [];
      
      for (const org of organizations || []) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email')
          .eq('organization_id', org.id)
          .limit(1);

        const email = profiles?.[0]?.email || 'Unbekannt';
        const isExpired = org.demo_expires_at 
          ? new Date(org.demo_expires_at) < new Date() 
          : false;

        demoAccounts.push({
          id: org.id,
          name: org.name,
          email,
          created_at: org.created_at,
          demo_expires_at: org.demo_expires_at,
          is_expired: isExpired,
        });
      }

      return demoAccounts;
    },
  });
}

export function useDemoAccountStats() {
  const { data: accounts } = useDemoAccounts();
  
  const stats = {
    total: accounts?.length || 0,
    active: accounts?.filter(a => !a.is_expired).length || 0,
    expired: accounts?.filter(a => a.is_expired).length || 0,
    expiringIn7Days: accounts?.filter(a => {
      if (!a.demo_expires_at || a.is_expired) return false;
      const expiryDate = new Date(a.demo_expires_at);
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return expiryDate <= sevenDaysFromNow;
    }).length || 0,
  };

  return stats;
}

export function useExtendDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, days }: { organizationId: string; days: number }) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + days);

      const { error } = await supabase
        .from('organizations')
        .update({ demo_expires_at: newExpiry.toISOString() })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-accounts'] });
      toast.success('Demo-Zeitraum verlängert');
    },
    onError: () => {
      toast.error('Fehler beim Verlängern');
    },
  });
}

export function useConvertDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const { error } = await supabase
        .from('organizations')
        .update({ 
          is_demo: false, 
          demo_expires_at: null 
        })
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-accounts'] });
      toast.success('Account konvertiert');
    },
    onError: () => {
      toast.error('Fehler beim Konvertieren');
    },
  });
}

export function useDeleteDemoAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      // Delete in order: order_items, orders, articles, suppliers, profiles, organization
      // Due to foreign key constraints, we need to delete in the right order
      
      // 1. Delete order items via orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        await supabase.from('order_items').delete().in('order_id', orderIds);
        await supabase.from('order_confirmation_tokens').delete().in('order_id', orderIds);
      }

      // 2. Delete organization data in order
      await supabase.from('orders').delete().eq('organization_id', organizationId);
      await supabase.from('cart_drafts').delete().eq('organization_id', organizationId);
      await supabase.from('articles').delete().eq('organization_id', organizationId);
      await supabase.from('suppliers').delete().eq('organization_id', organizationId);
      await supabase.from('categories').delete().eq('organization_id', organizationId);
      await supabase.from('units').delete().eq('organization_id', organizationId);
      await supabase.from('locations').delete().eq('organization_id', organizationId);
      await supabase.from('delivery_addresses').delete().eq('organization_id', organizationId);
      await supabase.from('email_templates').delete().eq('organization_id', organizationId);
      await supabase.from('supplier_portal_settings').delete().eq('organization_id', organizationId);
      
      // 3. Get and delete user roles for profiles in this org
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.id);
        await supabase.from('user_roles').delete().in('user_id', userIds);
        await supabase.from('notification_preferences').delete().in('user_id', userIds);
      }

      // 4. Delete profiles
      await supabase.from('profiles').delete().eq('organization_id', organizationId);

      // 5. Finally delete organization
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-accounts'] });
      toast.success('Demo-Account gelöscht');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    },
  });
}
