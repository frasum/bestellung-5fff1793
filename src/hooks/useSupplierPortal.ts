import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSendSupplierInvitation = () => {
  const [loading, setLoading] = useState(false);

  const sendInvitation = async (
    supplierId: string,
    supplierEmail: string,
    supplierName: string,
    organizationName: string
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-supplier-magic-link', {
        body: {
          supplierId,
          supplierEmail,
          supplierName,
          organizationName,
        },
      });

      if (error) throw error;

      toast.success(`Einladung an ${supplierEmail} gesendet`);
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
