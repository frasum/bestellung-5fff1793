import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePhotoCaptureToken = () => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const createToken = async (): Promise<string | null> => {
    if (!user) return null;
    
    setIsCreating(true);
    try {
      // Get user's organization_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        console.error('Failed to get organization:', profileError);
        return null;
      }

      // Create token
      const { data, error } = await supabase
        .from('photo_capture_tokens')
        .insert({
          organization_id: profile.organization_id,
          user_id: user.id,
        })
        .select('token')
        .single();

      if (error) {
        console.error('Failed to create token:', error);
        return null;
      }

      return data.token;
    } catch (err) {
      console.error('Error creating photo capture token:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const getQrCodeUrl = (token: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/photo-capture?token=${token}`;
  };

  return {
    createToken,
    getQrCodeUrl,
    isCreating,
  };
};
