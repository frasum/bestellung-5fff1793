import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type FeaturePriority = 'green' | 'yellow' | 'red' | null;

export interface SystemFeaturePriority {
  id: string;
  organization_id: string;
  category: string;
  feature_key: string;
  priority: FeaturePriority;
  notes: string | null;
  is_worked_on: boolean;
  updated_at: string;
  updated_by: string | null;
}

export const useSystemFeaturePriorities = () => {
  return useQuery({
    queryKey: ['system-feature-priorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_feature_priorities')
        .select('*');

      if (error) throw error;
      return data as SystemFeaturePriority[];
    },
  });
};

export const useUpsertFeaturePriority = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      category,
      featureKey,
      priority,
      notes,
    }: {
      category: string;
      featureKey: string;
      priority: FeaturePriority;
      notes?: string | null;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Check if entry exists
      const { data: existing } = await supabase
        .from('system_feature_priorities')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('category', category)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (existing) {
        // Update
        const updateData: Record<string, unknown> = {
          priority,
          updated_at: new Date().toISOString(),
          updated_by: userData.user.id,
        };
        if (notes !== undefined) {
          updateData.notes = notes;
        }

        const { error } = await supabase
          .from('system_feature_priorities')
          .update(updateData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('system_feature_priorities')
          .insert({
            organization_id: profile.organization_id,
            category,
            feature_key: featureKey,
            priority,
            notes: notes || null,
            updated_by: userData.user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-feature-priorities'] });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Priorität konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
      console.error('Error saving priority:', error);
    },
  });
};

export const useToggleFeatureWorkedOn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      category,
      featureKey,
      isWorkedOn,
    }: {
      category: string;
      featureKey: string;
      isWorkedOn: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Check if entry exists
      const { data: existing } = await supabase
        .from('system_feature_priorities')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('category', category)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_feature_priorities')
          .update({
            is_worked_on: isWorkedOn,
            updated_at: new Date().toISOString(),
            updated_by: userData.user.id,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_feature_priorities')
          .insert({
            organization_id: profile.organization_id,
            category,
            feature_key: featureKey,
            priority: null,
            is_worked_on: isWorkedOn,
            updated_by: userData.user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-feature-priorities'] });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
      console.error('Error toggling worked on:', error);
    },
  });
};

export const useUpdateFeatureNotes = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      category,
      featureKey,
      notes,
    }: {
      category: string;
      featureKey: string;
      notes: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Check if entry exists
      const { data: existing } = await supabase
        .from('system_feature_priorities')
        .select('id')
        .eq('organization_id', profile.organization_id)
        .eq('category', category)
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('system_feature_priorities')
          .update({
            notes,
            updated_at: new Date().toISOString(),
            updated_by: userData.user.id,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert with just notes (no priority)
        const { error } = await supabase
          .from('system_feature_priorities')
          .insert({
            organization_id: profile.organization_id,
            category,
            feature_key: featureKey,
            priority: null,
            notes,
            updated_by: userData.user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-feature-priorities'] });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Notiz konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
      console.error('Error saving notes:', error);
    },
  });
};

export const useBulkSetCategoryPriority = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      category,
      featureKeys,
      priority,
    }: {
      category: string;
      featureKeys: string[];
      priority: FeaturePriority;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Upsert all features in category
      for (const featureKey of featureKeys) {
        const { data: existing } = await supabase
          .from('system_feature_priorities')
          .select('id')
          .eq('organization_id', profile.organization_id)
          .eq('category', category)
          .eq('feature_key', featureKey)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('system_feature_priorities')
            .update({
              priority,
              updated_at: new Date().toISOString(),
              updated_by: userData.user.id,
            })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('system_feature_priorities')
            .insert({
              organization_id: profile.organization_id,
              category,
              feature_key: featureKey,
              priority,
              updated_by: userData.user.id,
            });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-feature-priorities'] });
      toast({
        title: 'Gespeichert',
        description: 'Alle Prioritäten der Kategorie wurden aktualisiert.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Prioritäten konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
      console.error('Error bulk saving:', error);
    },
  });
};
