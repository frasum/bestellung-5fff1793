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
      // Delete in order due to foreign key constraints
      
      // 1. Delete order items and confirmation tokens via orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        await supabase.from('order_items').delete().in('order_id', orderIds);
        await supabase.from('order_confirmation_tokens').delete().in('order_id', orderIds);
      }
      await supabase.from('orders').delete().eq('organization_id', organizationId);

      // 2. Delete cart draft items before cart drafts
      const { data: drafts } = await supabase
        .from('cart_drafts')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (drafts && drafts.length > 0) {
        const draftIds = drafts.map(d => d.id);
        await supabase.from('cart_draft_items').delete().in('draft_id', draftIds);
      }
      await supabase.from('cart_drafts').delete().eq('organization_id', organizationId);

      // 3. Delete supplier-related data before suppliers
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (suppliers && suppliers.length > 0) {
        const supplierIds = suppliers.map(s => s.id);
        await supabase.from('supplier_locations').delete().in('supplier_id', supplierIds);
        await supabase.from('supplier_portal_tokens').delete().in('supplier_id', supplierIds);
        await supabase.from('magic_link_rate_limits').delete().in('supplier_id', supplierIds);
        await supabase.from('suggested_articles').delete().in('supplier_id', supplierIds);
        await supabase.from('supplier_article_changes').delete().in('supplier_id', supplierIds);
      }
      
      // 4. Delete articles before suppliers (articles reference suppliers)
      await supabase.from('articles').delete().eq('organization_id', organizationId);
      await supabase.from('suppliers').delete().eq('organization_id', organizationId);
      
      // 5. Delete other organization data
      await supabase.from('categories').delete().eq('organization_id', organizationId);
      await supabase.from('units').delete().eq('organization_id', organizationId);
      await supabase.from('order_units').delete().eq('organization_id', organizationId);
      await supabase.from('inventory_sessions').delete().eq('organization_id', organizationId);
      await supabase.from('simple_order_tokens').delete().eq('organization_id', organizationId);
      await supabase.from('photo_capture_tokens').delete().eq('organization_id', organizationId);
      
      // 6. Delete locations and delivery addresses
      await supabase.from('delivery_addresses').delete().eq('organization_id', organizationId);
      await supabase.from('locations').delete().eq('organization_id', organizationId);
      
      // 7. Delete email templates and portal settings
      await supabase.from('email_templates').delete().eq('organization_id', organizationId);
      await supabase.from('supplier_portal_settings').delete().eq('organization_id', organizationId);
      
      // 8. Delete employees and their related data
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (employees && employees.length > 0) {
        const employeeIds = employees.map(e => e.id);
        await supabase.from('employee_locations').delete().in('employee_id', employeeIds);
        await supabase.from('employee_location_suppliers').delete().in('employee_id', employeeIds);
        await supabase.from('employee_article_favorites').delete().in('employee_id', employeeIds);
      }
      await supabase.from('employees').delete().eq('organization_id', organizationId);
      
      // 9. Delete user roles and notification preferences for profiles in this org
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', organizationId);
      
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.id);
        await supabase.from('user_roles').delete().in('user_id', userIds);
        await supabase.from('notification_preferences').delete().in('user_id', userIds);
        await supabase.from('user_delivery_preferences').delete().in('user_id', userIds);
      }

      // 10. Delete profiles
      await supabase.from('profiles').delete().eq('organization_id', organizationId);

      // 11. Finally delete organization
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

export function useClearCatalog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      // Delete articles first (due to foreign key constraints)
      const { error: articlesError } = await supabase
        .from('articles')
        .delete()
        .eq('organization_id', organizationId);

      if (articlesError) throw articlesError;

      // Then delete suppliers
      const { error: suppliersError } = await supabase
        .from('suppliers')
        .delete()
        .eq('organization_id', organizationId);

      if (suppliersError) throw suppliersError;

      // Delete categories
      await supabase.from('categories').delete().eq('organization_id', organizationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demo-accounts'] });
      toast.success('Katalog geleert – Account ist jetzt leer für Onboarding-Tests');
    },
    onError: (error) => {
      console.error('Clear catalog error:', error);
      toast.error('Fehler beim Leeren des Katalogs');
    },
  });
}
