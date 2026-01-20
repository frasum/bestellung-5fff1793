import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UseEmployeeOrderNotificationsProps {
  employeeId: string | null;
  enabled?: boolean;
}

export const useEmployeeOrderNotifications = ({
  employeeId,
  enabled = true,
}: UseEmployeeOrderNotificationsProps) => {
  const { t } = useTranslation();
  const hasShownRef = useRef<Set<string>>(new Set());

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error: unknown) {
      // Silent fail for notification sounds - not critical
    }
  }, []);

  useEffect(() => {
    if (!enabled || !employeeId) {
      return;
    }

    console.log('[EmployeeOrderNotifications] Setting up subscription for employee:', employeeId);

    const channel = supabase
      .channel(`employee-notifications-${employeeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'employee_notifications',
          filter: `employee_id=eq.${employeeId}`,
        },
        (payload) => {
          console.log('[EmployeeOrderNotifications] Received notification:', payload);
          
          const notification = payload.new as {
            id: string;
            employee_id: string;
            order_id: string;
            type: string;
            message: string;
            is_read: boolean;
            created_at: string;
          };

          // Prevent duplicate notifications
          if (hasShownRef.current.has(notification.id)) {
            return;
          }
          hasShownRef.current.add(notification.id);

          // Play notification sound
          playNotificationSound();

          // Show toast notification
          if (notification.type === 'order_confirmed') {
            toast.success(t('simpleOrder.orderConfirmedBySupplier', 'Bestellung bestätigt!'), {
              description: notification.message,
              duration: 8000,
              icon: '✅',
            });
          } else {
            toast.info(notification.message, {
              duration: 6000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[EmployeeOrderNotifications] Subscription status:', status);
      });

    return () => {
      console.log('[EmployeeOrderNotifications] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [employeeId, enabled, playNotificationSound, t]);
};
