import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UserDeliveryPreference {
  id: string;
  user_id: string;
  location_id: string;
  delivery_address_id: string;
  created_at: string;
  updated_at: string;
}

export const useUserDeliveryPreference = () => {
  const { user } = useAuth();
  const { activeLocation } = useLocationContext();

  return useQuery({
    queryKey: ['user-delivery-preference', user?.id, activeLocation?.id],
    queryFn: async () => {
      if (!user?.id || !activeLocation?.id) return null;

      const { data, error } = await supabase
        .from('user_delivery_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('location_id', activeLocation.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserDeliveryPreference | null;
    },
    enabled: !!user?.id && !!activeLocation?.id,
  });
};

// Fetch all user delivery preferences for all locations
export const useAllUserDeliveryPreferences = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-delivery-preferences-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_delivery_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as UserDeliveryPreference[];
    },
    enabled: !!user?.id,
  });
};

// Fetch all delivery addresses (not filtered by location)
export const useAllDeliveryAddresses = () => {
  return useQuery({
    queryKey: ['delivery-addresses-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('label');

      if (error) throw error;
      return data;
    },
  });
};

export const useUpsertUserDeliveryPreference = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeLocation } = useLocationContext();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (deliveryAddressId: string) => {
      if (!user?.id || !activeLocation?.id) {
        throw new Error('User or location not available');
      }

      const { data, error } = await supabase
        .from('user_delivery_preferences')
        .upsert(
          {
            user_id: user.id,
            location_id: activeLocation.id,
            delivery_address_id: deliveryAddressId,
          },
          {
            onConflict: 'user_id,location_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-delivery-preference'] });
      queryClient.invalidateQueries({ queryKey: ['user-delivery-preferences-all'] });
      toast.success(t('settings.defaultAddressSaved'));
    },
    onError: (error) => {
      console.error('Error saving delivery preference:', error);
      toast.error(t('settings.defaultAddressError'));
    },
  });
};

// Upsert for specific location (not dependent on activeLocation)
export const useUpsertUserDeliveryPreferenceForLocation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ locationId, deliveryAddressId }: { locationId: string; deliveryAddressId: string }) => {
      if (!user?.id) {
        throw new Error('User not available');
      }

      const { data, error } = await supabase
        .from('user_delivery_preferences')
        .upsert(
          {
            user_id: user.id,
            location_id: locationId,
            delivery_address_id: deliveryAddressId,
          },
          {
            onConflict: 'user_id,location_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-delivery-preference'] });
      queryClient.invalidateQueries({ queryKey: ['user-delivery-preferences-all'] });
      toast.success(t('settings.defaultAddressSaved'));
    },
    onError: (error) => {
      console.error('Error saving delivery preference:', error);
      toast.error(t('settings.defaultAddressError'));
    },
  });
};
