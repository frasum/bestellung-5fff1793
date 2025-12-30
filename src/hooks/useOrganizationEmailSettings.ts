import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface OrganizationEmailSettings {
  id: string;
  organization_id: string;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  mailbox: string;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
  // Note: imap_password_encrypted is not exposed to frontend
}

export interface EmailSettingsFormData {
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_password?: string; // Only sent when updating password
  mailbox: string;
  is_active: boolean;
}

export function useOrganizationEmailSettings() {
  const { session } = useAuth();

  return useQuery({
    queryKey: ['organization-email-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_email_settings')
        .select('id, organization_id, imap_host, imap_port, imap_user, mailbox, is_active, last_checked_at, created_at, updated_at')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found - return null
          return null;
        }
        throw error;
      }

      return data as OrganizationEmailSettings;
    },
    enabled: !!session,
  });
}

export function useUpdateEmailSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmailSettingsFormData) => {
      const { data, error } = await supabase.functions.invoke('update-email-settings', {
        body: formData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-email-settings'] });
      toast.success('E-Mail-Einstellungen gespeichert');
    },
    onError: (error: Error) => {
      console.error('Failed to update email settings:', error);
      toast.error(`Fehler beim Speichern: ${error.message}`);
    },
  });
}

export function useTestEmailConnection() {
  return useMutation({
    mutationFn: async (formData: EmailSettingsFormData) => {
      const { data, error } = await supabase.functions.invoke('test-email-connection', {
        body: formData,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Verbindung erfolgreich! ${data.messageCount ?? 0} E-Mails im Postfach.`);
      }
    },
    onError: (error: Error) => {
      console.error('Connection test failed:', error);
      toast.error(`Verbindungstest fehlgeschlagen: ${error.message}`);
    },
  });
}
