import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useInvitation(inviteToken: string | null) {
  const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);
  const navigate = useNavigate();

  const acceptInvitation = async (): Promise<boolean> => {
    if (!inviteToken) return true;
    
    setIsAcceptingInvitation(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-invitation', {
        body: { token: inviteToken }
      });

      if (error) {
        console.error('Accept invitation error:', error);
        toast.error('Fehler beim Annehmen der Einladung');
        return false;
      }

      if (data?.error) {
        toast.error(data.error);
        return false;
      }

      toast.success(`Willkommen im Team von ${data.organizationName}!`);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Accept invitation error:', message);
      toast.error('Fehler beim Annehmen der Einladung');
      return false;
    } finally {
      setIsAcceptingInvitation(false);
    }
  };

  return {
    isAcceptingInvitation,
    acceptInvitation,
  };
}
