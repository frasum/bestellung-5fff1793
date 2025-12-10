import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { toast } from 'sonner';

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

export const useUpsertUserDeliveryPreference = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeLocation } = useLocationContext();

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
      toast.success('Standard-Lieferadresse gespeichert');
    },
    onError: (error) => {
      console.error('Error saving delivery preference:', error);
      toast.error('Fehler beim Speichern der Standard-Lieferadresse');
    },
  });
};
