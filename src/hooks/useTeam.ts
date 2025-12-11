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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    queryFn: async () => {
      // Get current user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user!.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      // Get all profiles in the organization
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('organization_id', profile.organization_id);

      if (profilesError) throw profilesError;
      if (!profiles?.length) return [];

      // Get all roles for these users in a single query
      const userIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      // Create a map for O(1) role lookups
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      // Combine profiles with roles
      return profiles.map(p => ({
        ...p,
        role: (roleMap.get(p.id) || 'viewer') as TeamMember['role'],
      }));
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
    onMutate: async ({ userId, role }) => {
      await queryClient.cancelQueries({ queryKey: ['team-members'] });
      const previousMembers = queryClient.getQueryData<TeamMember[]>(['team-members']);
      
      queryClient.setQueryData<TeamMember[]>(['team-members'], (old) =>
        old?.map((member) => member.id === userId ? { ...member, role } : member)
      );
      
      return { previousMembers };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['team-members'], context.previousMembers);
      }
      toast.error('Failed to update role');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onSuccess: () => toast.success('Role updated'),
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('remove_team_member', {
        member_user_id: userId
      });

      if (error) throw error;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['team-members'] });
      const previousMembers = queryClient.getQueryData<TeamMember[]>(['team-members']);
      
      queryClient.setQueryData<TeamMember[]>(['team-members'], (old) =>
        old?.filter((member) => member.id !== userId)
      );
      
      return { previousMembers };
    },
    onError: (_err, _userId, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(['team-members'], context.previousMembers);
      }
      toast.error('Failed to remove member');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onSuccess: () => toast.success('Member removed'),
  });
};

export const useTeamInvitations = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-invitations'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
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
        }
      } catch (emailErr) {
        console.error('Error calling send-invitation-email:', emailErr);
      }
    },
    onMutate: async ({ email, role }) => {
      await queryClient.cancelQueries({ queryKey: ['team-invitations'] });
      const previousInvitations = queryClient.getQueryData<TeamInvitation[]>(['team-invitations']);
      
      const optimisticInvitation: TeamInvitation = {
        id: crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        role,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<TeamInvitation[]>(['team-invitations'], (old) =>
        [optimisticInvitation, ...(old || [])]
      );
      
      return { previousInvitations };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousInvitations) {
        queryClient.setQueryData(['team-invitations'], context.previousInvitations);
      }
      toast.error(error.message || 'Failed to send invitation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
    },
    onSuccess: () => toast.success('Invitation sent'),
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['team-invitations'] });
      const previousInvitations = queryClient.getQueryData<TeamInvitation[]>(['team-invitations']);
      
      queryClient.setQueryData<TeamInvitation[]>(['team-invitations'], (old) =>
        old?.filter((inv) => inv.id !== id)
      );
      
      return { previousInvitations };
    },
    onError: (_err, _id, context) => {
      if (context?.previousInvitations) {
        queryClient.setQueryData(['team-invitations'], context.previousInvitations);
      }
      toast.error('Failed to cancel invitation');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['team-invitations'] });
    },
    onSuccess: () => toast.success('Invitation cancelled'),
  });
};

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    staleTime: 10 * 60 * 1000, // 10 minutes (role changes rarely)
    gcTime: 15 * 60 * 1000, // 15 minutes cache
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
