import { useEffect, useRef } from 'react';
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

  // Keep latest desktop notification handlers in refs so the
  // realtime subscription doesn't need to re-subscribe on change
  const showNotificationRef = useRef(showNotification);
  const permissionRef = useRef(permission);

  useEffect(() => {
    showNotificationRef.current = showNotification;
    permissionRef.current = permission;
  }, [showNotification, permission]);

  useEffect(() => {
    // Only subscribe when user is authenticated
    if (!user) return;

    console.log('🔔 Setting up realtime notifications channel...');

    const channelName = `global-notifications-${user.id}`;
    let isActive = true;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cart_drafts',
        },
        (payload) => {
          if (!isActive) return;
          console.log('🔔 Realtime INSERT received:', payload);
          // Invalidate all cart-drafts queries regardless of locationId
          queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'cart-drafts',
          });

          // Show toast notification for new EasyOrder
          const newDraft = payload.new as { name?: string; id?: string };
          if (newDraft.name?.startsWith('EasyOrder:')) {
            toast.success(t('drafts.newEasyOrder'), {
              description: newDraft.name,
            });

            // Show desktop notification if tab is not focused
            if (document.hidden && permissionRef.current === 'granted') {
              showNotificationRef.current?.(t('drafts.newEasyOrder'), {
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
          table: 'cart_drafts',
        },
        (payload) => {
          if (!isActive) return;
          // Invalidate all cart-drafts queries to refresh the list
          queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'cart-drafts',
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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (!isActive) return;
          // Invalidate orders queries to refresh the list
          queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'orders',
          });

          // Show toast notification when order status changes to confirmed
          const updatedOrder = payload.new as {
            status?: string;
            order_number?: string;
          };
          const oldOrder = payload.old as { status?: string };

          if (
            updatedOrder.status !== oldOrder.status &&
            updatedOrder.status === 'confirmed'
          ) {
            toast.success(
              t('orders.orderConfirmed', 'Bestellung bestätigt'),
              {
                description: updatedOrder.order_number,
              }
            );

            // Show desktop notification if tab is not focused
            if (document.hidden && permissionRef.current === 'granted') {
              showNotificationRef.current?.(
                t('orders.orderConfirmed', 'Bestellung bestätigt'),
                {
                  body: updatedOrder.order_number || '',
                  tag: `order-confirmed-${updatedOrder.order_number}`,
                }
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (!isActive) return;
          // Invalidate orders queries to refresh the list
          queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === 'orders',
          });
        }
      )
      .subscribe((status, err) => {
        console.log('🔔 Realtime subscription status:', status);
        if (err) {
          console.error('🔔 Realtime subscription error:', err);
        }

        if (
          isActive &&
          (status === 'TIMED_OUT' ||
            status === 'CHANNEL_ERROR' ||
            status === 'CLOSED')
        ) {
          console.warn(
            '🔔 Realtime channel not active, attempting resubscribe...',
            status
          );
          setTimeout(() => {
            if (!isActive) return;
            try {
              channel.subscribe();
            } catch (subscribeError) {
              console.error(
                '🔔 Error while resubscribing channel:',
                subscribeError
              );
            }
          }, 2000);
        }
      });

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
    };
  }, [queryClient, t, user]);
};
