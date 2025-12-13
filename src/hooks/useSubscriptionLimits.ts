import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

interface SubscriptionLimits {
  ordersPerMonth: number | 'unlimited';
  suppliers: number | 'unlimited';
  users: number | 'unlimited';
}

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: { ordersPerMonth: 5, suppliers: 2, users: 1 },
  basic: { ordersPerMonth: 50, suppliers: 10, users: 3 },
  pro: { ordersPerMonth: 'unlimited', suppliers: 'unlimited', users: 10 },
  enterprise: { ordersPerMonth: 'unlimited', suppliers: 'unlimited', users: 'unlimited' },
};

interface Usage {
  ordersThisMonth: number;
  suppliersCount: number;
  usersCount: number;
}

interface SubscriptionStatus {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  usage: Usage;
  canCreateOrder: boolean;
  canAddSupplier: boolean;
  canInviteUser: boolean;
  ordersRemaining: number | 'unlimited';
  suppliersRemaining: number | 'unlimited';
  usersRemaining: number | 'unlimited';
  isLoading: boolean;
}

export function useSubscriptionLimits(): SubscriptionStatus {
  const { user } = useAuth();

  // Fetch organization and tier
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (!profile?.organization_id) return null;
      
      const { data: org } = await supabase
        .from('organizations')
        .select('id, subscription_tier')
        .eq('id', profile.organization_id)
        .single();
      
      return org;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch current usage
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['subscription-usage', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // Count orders this month
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      // Count active suppliers
      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('is_active', true);

      // Count team members (profiles in this org)
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      return {
        ordersThisMonth: ordersCount || 0,
        suppliersCount: suppliersCount || 0,
        usersCount: usersCount || 0,
      };
    },
    enabled: !!organization?.id,
    staleTime: 1 * 60 * 1000, // Refresh every minute
  });

  const tier = (organization?.subscription_tier as SubscriptionTier) || 'free';
  const limits = TIER_LIMITS[tier];
  const currentUsage: Usage = usage || { ordersThisMonth: 0, suppliersCount: 0, usersCount: 0 };

  // Calculate remaining
  const ordersRemaining = limits.ordersPerMonth === 'unlimited' 
    ? 'unlimited' 
    : Math.max(0, limits.ordersPerMonth - currentUsage.ordersThisMonth);
  
  const suppliersRemaining = limits.suppliers === 'unlimited'
    ? 'unlimited'
    : Math.max(0, limits.suppliers - currentUsage.suppliersCount);
  
  const usersRemaining = limits.users === 'unlimited'
    ? 'unlimited'
    : Math.max(0, limits.users - currentUsage.usersCount);

  // Check permissions
  const canCreateOrder = ordersRemaining === 'unlimited' || ordersRemaining > 0;
  const canAddSupplier = suppliersRemaining === 'unlimited' || suppliersRemaining > 0;
  const canInviteUser = usersRemaining === 'unlimited' || usersRemaining > 0;

  return {
    tier,
    limits,
    usage: currentUsage,
    canCreateOrder,
    canAddSupplier,
    canInviteUser,
    ordersRemaining,
    suppliersRemaining,
    usersRemaining,
    isLoading: orgLoading || usageLoading,
  };
}

export function formatLimit(value: number | 'unlimited'): string {
  return value === 'unlimited' ? 'Unbegrenzt' : String(value);
}

export function useUpdateSubscriptionTier() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newTier: SubscriptionTier) => {
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      const { error } = await supabase
        .from('organizations')
        .update({ subscription_tier: newTier })
        .eq('id', profile.organization_id);

      if (error) throw error;
      return newTier;
    },
    onSuccess: (newTier) => {
      queryClient.invalidateQueries({ queryKey: ['organization-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-usage'] });
      toast.success(`Plan geändert zu ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}`);
    },
    onError: (error) => {
      toast.error('Fehler beim Ändern des Plans');
      console.error(error);
    },
  });
}
