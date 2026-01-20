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
  last_error: string | null;
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
        .select('id, organization_id, imap_host, imap_port, imap_user, mailbox, is_active, last_checked_at, last_error, created_at, updated_at')
        .maybeSingle();

      if (error) {
        console.error('Error loading email settings:', error);
        throw error;
      }

      console.log('Loaded email settings:', data ? { id: data.id, imap_host: data.imap_host, is_active: data.is_active } : 'null');
      return data as OrganizationEmailSettings | null;
    },
    enabled: !!session,
    refetchOnMount: 'always',
    staleTime: 0,
  });
}

// Helper to extract error message from FunctionsHttpError
async function extractErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        if (body?.error) return body.error;
      } catch (parseError) {
        console.warn('Failed to parse error response:', parseError);
      }
    }
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useUpdateEmailSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: EmailSettingsFormData) => {
      const { data, error } = await supabase.functions.invoke('update-email-settings', {
        body: formData,
      });

      if (error) {
        const msg = await extractErrorMessage(error);
        throw new Error(msg);
      }
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

      if (error) {
        const msg = await extractErrorMessage(error);
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: (data: { success?: boolean; message?: string }) => {
      if (data?.success) {
        toast.success(data.message || 'Host erreichbar');
      }
    },
    onError: (error: Error) => {
      console.error('Host validation failed:', error);
      toast.error(`Host-Prüfung fehlgeschlagen: ${error.message}`);
    },
  });
}
