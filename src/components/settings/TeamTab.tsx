import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2, User, Mail, Clock, X, Users, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTeamMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useTeamInvitations,
  useCreateInvitation,
  useDeleteInvitation,
  useUserRole,
  TeamMember,
} from '@/hooks/useTeam';
import { PermissionsOverview } from './PermissionsOverview';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog';

export const TeamTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: currentUserRole } = useUserRole();
  const { data: members = [], isLoading: membersLoading } = useTeamMembers();
  const { data: invitations = [], isLoading: invitationsLoading } = useTeamInvitations();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamMember['role']>('viewer');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  // Subscription limits
  const subscriptionLimits = useSubscriptionLimits();

  const isAdmin = currentUserRole === 'admin';
  const isLoading = membersLoading || invitationsLoading;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    createInvitation.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteEmail('');
          setInviteRole('viewer');
          setInviteDialogOpen(false);
        },
      }
    );
  };

  const roleLabels: Record<TeamMember['role'], string> = {
    admin: t('settings.roles.admin'),
    manager: t('settings.roles.manager'),
    purchaser: t('settings.roles.purchaser'),
    viewer: t('settings.roles.viewer'),
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            {/* Team Members */}
            <AccordionItem value="members" className="border-b">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center justify-between w-full pr-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                    <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.teamMembers')}</span>
                    <Badge variant="secondary" className="ml-1">{members.length}</Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">{t('settings.teamDescription')}</p>
                
                {isAdmin && (
                  <div className="mb-4">
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          className="gap-2 w-full sm:w-auto"
                          onClick={(e) => {
                            if (!subscriptionLimits.canInviteUser) {
                              e.preventDefault();
                              setShowUpgradeDialog(true);
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          {t('settings.inviteMember')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>{t('settings.inviteTitle')}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">{t('settings.emailAddress')}</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder={t('settings.emailPlaceholder')}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-role">{t('settings.role')}</Label>
                            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamMember['role'])}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">{t('settings.roles.viewer')} - {t('settings.roles.viewerDesc')}</SelectItem>
                                <SelectItem value="purchaser">{t('settings.roles.purchaser')} - {t('settings.roles.purchaserDesc')}</SelectItem>
                                <SelectItem value="manager">{t('settings.roles.manager')} - {t('settings.roles.managerDesc')}</SelectItem>
                                <SelectItem value="admin">{t('settings.roles.admin')} - {t('settings.roles.adminDesc')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button type="submit" className="w-full" disabled={createInvitation.isPending}>
                            {createInvitation.isPending ? t('settings.sending') : t('settings.sendInvitation')}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {members.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('settings.noMembers')}</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3 bg-background">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{member.full_name || t('settings.noName')}</p>
                            <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap ml-13 sm:ml-0">
                          {isAdmin && member.id !== user?.id ? (
                            <>
                              <Select
                                value={member.role}
                                onValueChange={(role) => updateRole.mutate({ userId: member.id, role: role as TeamMember['role'] })}
                              >
                                <SelectTrigger className="w-full sm:w-32 h-10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">{roleLabels.viewer}</SelectItem>
                                  <SelectItem value="purchaser">{roleLabels.purchaser}</SelectItem>
                                  <SelectItem value="manager">{roleLabels.manager}</SelectItem>
                                  <SelectItem value="admin">{roleLabels.admin}</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 flex-shrink-0"
                                onClick={() => removeMember.mutate(member.id)}
                                disabled={removeMember.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                          )}
                          {member.id === user?.id && (
                            <Badge variant="outline">{t('settings.you')}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Pending Invitations */}
            {isAdmin && invitations.length > 0 && (
              <AccordionItem value="invitations" className="border-b">
                <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                    <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.pendingInvitations')}</span>
                    <Badge variant="secondary" className="ml-1">{invitations.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 bg-primary/5">
                  <p className="text-sm text-muted-foreground mb-4">{t('settings.pendingDescription')}</p>
                  <div className="space-y-3">
                    {invitations.map((invitation) => (
                      <div key={invitation.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3 bg-background">
                        <div className="space-y-1 min-w-0">
                          <p className="font-medium truncate">{invitation.email}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <Badge variant="secondary">{roleLabels[invitation.role]}</Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {t('settings.expires')} {new Date(invitation.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 self-end sm:self-auto flex-shrink-0"
                          onClick={() => deleteInvitation.mutate(invitation.id)}
                          disabled={deleteInvitation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Permissions Overview */}
            <AccordionItem value="permissions">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.permissionsOverview')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <PermissionsOverview />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        limitType="users"
        currentTier={subscriptionLimits.tier}
        currentUsage={subscriptionLimits.usage.usersCount}
        limit={subscriptionLimits.limits.users}
      />
    </>
  );
};
