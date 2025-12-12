import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DeliveryAddress {
  id: string;
  organization_id: string;
  location_id: string | null;
  label: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_order_confirmation: boolean;
  email_order_status: boolean;
  email_weekly_report: boolean;
  email_supplier_updates: boolean;
  email_preorder_received: boolean;
}

export interface Organization {
  id: string;
  name: string;
  subscription_tier: string;
  trial_ends_at: string | null;
  test_mode_enabled: boolean;
  test_email: string | null;
  is_demo: boolean;
  demo_expires_at: string | null;
}

export const useOrganization = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!user,
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; name?: string; test_mode_enabled?: boolean; test_email?: string | null }) => {
      const { id, ...data } = updates;
      const { error } = await supabase
        .from('organizations')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast.success('Organization updated');
    },
    onError: () => toast.error('Failed to update organization'),
  });
};

export const useDeliveryAddresses = (locationId?: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['delivery-addresses', locationId],
    queryFn: async () => {
      let query = supabase
        .from('delivery_addresses')
        .select('*')
        .order('is_default', { ascending: false });

      if (locationId) {
        query = query.eq('location_id', locationId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DeliveryAddress[];
    },
    enabled: !!user,
  });
};

export const useCreateDeliveryAddress = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (address: Omit<DeliveryAddress, 'id' | 'organization_id' | 'created_at' | 'updated_at'>) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // If setting as default, unset other defaults first (within the same location)
      if (address.is_default && address.location_id) {
        await supabase
          .from('delivery_addresses')
          .update({ is_default: false })
          .eq('organization_id', profile.organization_id)
          .eq('location_id', address.location_id);
      }

      const { error } = await supabase
        .from('delivery_addresses')
        .insert({ ...address, organization_id: profile.organization_id });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-addresses'] });
      toast.success('Address added');
    },
    onError: () => toast.error('Failed to add address'),
  });
};

export const useUpdateDeliveryAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliveryAddress> & { id: string }) => {
      // If setting as default, unset other defaults first (within the same location)
      if (updates.is_default) {
        const { data: address } = await supabase
          .from('delivery_addresses')
          .select('organization_id, location_id')
          .eq('id', id)
          .single();

        if (address) {
          let query = supabase
            .from('delivery_addresses')
            .update({ is_default: false })
            .eq('organization_id', address.organization_id);
          
          if (address.location_id) {
            query = query.eq('location_id', address.location_id);
          }
          
          await query;
        }
      }

      const { error } = await supabase
        .from('delivery_addresses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-addresses'] });
      toast.success('Address updated');
    },
    onError: () => toast.error('Failed to update address'),
  });
};

export const useDeleteDeliveryAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('delivery_addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-addresses'] });
      toast.success('Address deleted');
    },
    onError: () => toast.error('Failed to delete address'),
  });
};

export const useNotificationPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!user,
  });
};

export const useUpsertNotificationPreferences = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Omit<NotificationPreferences, 'id' | 'user_id'>) => {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({ ...preferences, user_id: user!.id }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences saved');
    },
    onError: () => toast.error('Failed to save preferences'),
  });
};

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', user!.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ full_name }: { full_name: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name })
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Password updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update password');
    },
  });
};
