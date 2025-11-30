import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EmailTemplate {
  id: string;
  organization_id: string;
  template_type: string;
  subject_template: string;
  greeting: string;
  introduction: string;
  closing: string;
  signature: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateUpdate {
  subject_template?: string;
  greeting?: string;
  introduction?: string;
  closing?: string;
  signature?: string;
}

export const useEmailTemplate = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['email-template', user?.id],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) return null;

      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('template_type', 'order')
        .maybeSingle();

      if (error) throw error;
      return data as EmailTemplate | null;
    },
    enabled: !!user,
  });
};

export const useUpsertEmailTemplate = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template: EmailTemplateUpdate) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // Check if template exists
      const { data: existing } = await supabase
        .from('email_templates')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('template_type', 'order')
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('email_templates')
          .update(template)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('email_templates')
          .insert({
            organization_id: profile.organization_id,
            template_type: 'order',
            ...template,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-template'] });
      toast.success('E-Mail-Vorlage gespeichert');
    },
    onError: (error) => {
      console.error('Error saving email template:', error);
      toast.error('Fehler beim Speichern der Vorlage');
    },
  });
};

// Default template values
export const getDefaultTemplate = (): EmailTemplateUpdate => ({
  subject_template: 'Neue Bestellung von {restaurant_name}{customer_number_suffix}',
  greeting: 'Guten Tag,',
  introduction: 'hiermit senden wir Ihnen unsere Bestellung:',
  closing: 'Vielen Dank für Ihre Zusammenarbeit.',
  signature: 'Mit freundlichen Grüßen,\n{restaurant_name}',
});
