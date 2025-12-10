import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'manager' | 'purchaser' | 'viewer';
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'purchaser' | 'viewer';
  expires_at: string;
  created_at: string;
}

export const useTeamMembers = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      // Get current user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // Get all profiles in the organization with their roles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('organization_id', profile.organization_id);

      if (error) throw error;

      // Get roles for each user
      const membersWithRoles = await Promise.all(
        profiles.map(async (p) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', p.id)
            .single();

          return {
            ...p,
            role: (roleData?.role || 'viewer') as TeamMember['role'],
          };
        })
      );

      return membersWithRoles as TeamMember[];
    },
    enabled: !!user,
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: TeamMember['role'] }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Role updated');
    },
    onError: () => toast.error('Failed to update role'),
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      // Remove user's organization association
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: null })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Member removed');
    },
    onError: () => toast.error('Failed to remove member'),
  });
};

export const useTeamInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('id, email, role, expires_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TeamInvitation[];
    },
    enabled: !!user,
  });
};

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: TeamMember['role'] }) => {
      // Get current user's profile with organization info
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, full_name')
        .eq('id', user!.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // Get organization name
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', profile.organization_id)
        .single();

      // Insert invitation and get the token
      const { data: invitation, error } = await supabase
        .from('team_invitations')
        .insert({
          organization_id: profile.organization_id,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user!.id,
        })
        .select('token')
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This email has already been invited');
        }
        throw error;
      }

      // Send invitation email via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            inviteeEmail: email.toLowerCase().trim(),
            inviterName: profile.full_name || user!.email || 'A team member',
            organizationName: org?.name || 'the organization',
            role,
            inviteToken: invitation.token,
            language: i18n.language,
          },
        });

        if (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Don't throw - invitation was created, just email failed
        }
      } catch (emailErr) {
        console.error('Error calling send-invitation-email:', emailErr);
        // Don't throw - invitation was created successfully
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      toast.success('Invitation sent');
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to send invitation'),
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
      toast.success('Invitation cancelled');
    },
    onError: () => toast.error('Failed to cancel invitation'),
  });
};

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      return data?.role as TeamMember['role'];
    },
    enabled: !!user,
  });
};
