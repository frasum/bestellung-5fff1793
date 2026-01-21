import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DemoFormData } from '../schemas';

type DemoType = 'standard' | 'empty' | 'voice' | 'question';

export function useDemoAccount() {
  const [loadingStates, setLoadingStates] = useState({
    standard: false,
    empty: false,
    voice: false,
    question: false,
  });
  const navigate = useNavigate();

  const setLoading = (type: DemoType, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [type]: value }));
  };

  const handleStartDemo = async (
    data: DemoFormData, 
    type: DemoType,
    onSuccess?: () => void
  ) => {
    const emptyAccount = type !== 'standard';
    setLoading(type, true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('create-demo-account', {
        body: { email: data.email, emptyAccount }
      });

      if (error) {
        toast.error(error.message || 'Fehler beim Erstellen des Demo-Accounts');
        setLoading(type, false);
        return;
      }

      if (result?.error) {
        toast.error(result.error);
        setLoading(type, false);
        return;
      }

      if (result?.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
        
        onSuccess?.();

        // Navigate based on demo type
        switch (type) {
          case 'standard':
            toast.success('Demo-Account erstellt! Willkommen bei Bestellung.pro');
            navigate('/suppliers');
            break;
          case 'empty':
            toast.success('Leerer Demo-Account erstellt! Testen Sie das Onboarding.');
            navigate('/suppliers');
            break;
          case 'voice':
            toast.success('Demo-Account erstellt! Starte Sprach-Onboarding...');
            navigate('/onboarding');
            break;
          case 'question':
            toast.success('Demo-Account erstellt! Starte Fragebogen-Onboarding...');
            navigate('/onboarding/questions');
            break;
        }
      } else if (result?.needsManualLogin) {
        toast.success('Demo-Account erstellt! Bitte melden Sie sich mit der E-Mail an.');
        onSuccess?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Demo error:', message);
      toast.error('Ein unerwarteter Fehler ist aufgetreten');
    }
    
    setLoading(type, false);
  };

  return {
    isDemoLoading: loadingStates.standard,
    isEmptyDemoLoading: loadingStates.empty,
    isVoiceOnboardingLoading: loadingStates.voice,
    isQuestionOnboardingLoading: loadingStates.question,
    handleStartDemo,
  };
}
