import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const useSendSupplierInvitation = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const sendInvitation = async (
    supplierId: string,
    supplierEmail: string,
    supplierName: string,
    organizationName: string
  ) => {
    setLoading(true);
    try {
      // Get organization ID for test mode check
      let organizationId: string | null = null;
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        organizationId = profile?.organization_id || null;
      }

      const { data, error } = await supabase.functions.invoke('send-supplier-magic-link', {
        body: {
          supplierId,
          supplierEmail,
          supplierName,
          organizationName,
          organizationId,
        },
      });

      if (error) throw error;

      // Show appropriate message based on test mode
      if (data?.isTestMode) {
        toast.success(`[TEST] Einladung an ${data.actualRecipient} gesendet (statt ${supplierEmail})`);
      } else {
        toast.success(`Einladung an ${supplierEmail} gesendet`);
      }
      return { success: true };
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error('Fehler beim Senden der Einladung: ' + error.message);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return { sendInvitation, loading };
};
