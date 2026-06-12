import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

export interface TranslationOverride {
  id: string;
  organization_id: string;
  language_code: string;
  translation_key: string;
  original_value: string | null;
  override_value: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useTranslationOverrides = () => {
  return useQuery({
    queryKey: ['translation-overrides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('translation_overrides')
        .select('*')
        .order('translation_key');

      if (error) throw error;
      return data as TranslationOverride[];
    },
  });
};

export const useUpsertTranslationOverride = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (override: {
      language_code: string;
      translation_key: string;
      original_value: string | null;
      override_value: string;
    }) => {
      // Get the user's organization_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const { data, error } = await supabase
        .from('translation_overrides')
        .upsert({
          organization_id: profile.organization_id,
          language_code: override.language_code,
          translation_key: override.translation_key,
          original_value: override.original_value,
          override_value: override.override_value,
          created_by: user.id,
        }, {
          onConflict: 'organization_id,language_code,translation_key',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['translation-overrides'] });
      // Apply the override immediately to i18n
      i18n.addResource(data.language_code, 'translation', data.translation_key, data.override_value);
    },
    onError: (error) => {
      console.error('Error saving translation override:', error);
      toast.error(t('settings.translationsTab.saveError'));
    },
  });
};

export const useDeleteTranslationOverride = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('translation_overrides')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation-overrides'] });
      toast.success(t('settings.translationsTab.resetSuccess'));
    },
    onError: (error) => {
      console.error('Error deleting translation override:', error);
      toast.error(t('settings.translationsTab.resetError'));
    },
  });
};

export const useBulkSaveTranslationOverrides = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (overrides: {
      language_code: string;
      translation_key: string;
      original_value: string | null;
      override_value: string;
    }[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const overridesWithOrg = overrides.map(o => ({
        language_code: o.language_code,
        translation_key: o.translation_key,
        original_value: o.original_value ?? '',
        override_value: o.override_value,
        organization_id: profile.organization_id,
        created_by: user.id,
      }));

      const { data, error } = await supabase
        .from('translation_overrides')
        .upsert(overridesWithOrg, {
          onConflict: 'organization_id,language_code,translation_key',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['translation-overrides'] });
      // Apply all overrides to i18n
      data?.forEach(override => {
        i18n.addResource(override.language_code, 'translation', override.translation_key, override.override_value);
      });
      toast.success(t('settings.translationsTab.saved'));
    },
    onError: (error) => {
      console.error('Error saving translation overrides:', error);
      toast.error(t('settings.translationsTab.saveError'));
    },
  });
};

// Function to apply overrides at app startup
export const applyTranslationOverrides = async () => {
  try {
    const { data: overrides, error } = await supabase
      .from('translation_overrides')
      .select('*');

    if (error) {
      console.error('Error loading translation overrides:', error);
      return;
    }

    if (overrides && overrides.length > 0) {
      overrides.forEach((override: TranslationOverride) => {
        i18n.addResource(
          override.language_code,
          'translation',
          override.translation_key,
          override.override_value
        );
      });
    }
  } catch (error) {
    console.error('Error applying translation overrides:', error);
  }
};
