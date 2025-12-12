import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';

export const useRealtimeNotifications = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showNotification, permission } = useDesktopNotifications();

  useEffect(() => {
    // Only subscribe when user is authenticated
    if (!user) return;

    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cart_drafts'
        },
        (payload) => {
          // Invalidate all cart-drafts queries regardless of locationId
          queryClient.invalidateQueries({ 
            predicate: (query) => query.queryKey[0] === 'cart-drafts'
          });
          
          // Show toast notification for new EasyOrder
          const newDraft = payload.new as { name?: string; id?: string };
          if (newDraft.name?.startsWith('EasyOrder:')) {
            toast.success(t('drafts.newEasyOrder'), {
              description: newDraft.name,
            });

            // Show desktop notification if tab is not focused
            if (document.hidden && permission === 'granted') {
              showNotification(t('drafts.newEasyOrder'), {
                body: newDraft.name,
                tag: `easyorder-${newDraft.id}`,
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cart_drafts'
        },
        (payload) => {
          // Invalidate all cart-drafts queries to refresh the list
          queryClient.invalidateQueries({ 
            predicate: (query) => query.queryKey[0] === 'cart-drafts'
          });
          
          // Show toast notification for updated EasyOrder
          const updatedDraft = payload.new as { name?: string; id?: string };
          if (updatedDraft.name?.startsWith('EasyOrder:')) {
            toast.info(t('drafts.orderUpdated', 'Bestellung aktualisiert'), {
              description: updatedDraft.name,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, t, user, showNotification, permission]);
};
