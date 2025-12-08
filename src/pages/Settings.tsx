import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Plus, Pencil, Trash2, Star, User, Lock, Users, Mail, Clock, X, Globe, FileText, RotateCcw, Moon, Sun, Ruler, Check, Store, Merge, ExternalLink, Upload, ImageIcon, Loader2, FlaskConical, Layers, MessageSquare, Bell } from 'lucide-react';
import { useSupplierPortalSettings, useUpsertSupplierPortalSettings, DEFAULT_PORTAL_SETTINGS } from '@/hooks/useSupplierPortalSettings';
import ReactMarkdown from 'react-markdown';
import { Textarea } from '@/components/ui/textarea';
import { PortalPreview } from '@/components/suppliers/PortalPreview';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation, Location } from '@/hooks/useLocations';
import {
  useOrganization,
  useUpdateOrganization,
  useDeliveryAddresses,
  useCreateDeliveryAddress,
  useUpdateDeliveryAddress,
  useDeleteDeliveryAddress,
  useNotificationPreferences,
  useUpsertNotificationPreferences,
  useUserProfile,
  useUpdateUserProfile,
  useUpdatePassword,
  DeliveryAddress,
} from '@/hooks/useSettings';
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
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useEmailTemplate, useUpsertEmailTemplate, getDefaultTemplate } from '@/hooks/useEmailTemplates';
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '@/hooks/useUnits';
import { useArticles } from '@/hooks/useArticles';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { Tag } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DemoAccountsTab } from '@/components/settings/DemoAccountsTab';
import { SettingsSearch } from '@/components/settings/SettingsSearch';
import { MasterDataTab } from '@/components/settings/MasterDataTab';
import { CommunicationTab } from '@/components/settings/CommunicationTab';

const Settings = () => {
  const { t } = useTranslation();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  // Tab state management
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSubTabs, setActiveSubTabs] = useState({
    'organization': 'general',
    'master-data': 'units',
    'communication': 'notifications',
  });

  // Handle navigation from search
  const handleNavigate = (tab: string, subTab?: string) => {
    setActiveTab(tab);
    if (subTab) {
      setActiveSubTabs(prev => ({ ...prev, [tab]: subTab }));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.description')}</p>
        </div>

        {/* Settings Search */}
        <SettingsSearch onNavigate={handleNavigate} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max sm:w-auto sm:flex-wrap gap-1">
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('settings.profile')}</span>
                <span className="sm:hidden">{t('settings.profile')}</span>
              </TabsTrigger>
              <TabsTrigger value="organization" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('settings.organization')}</span>
                <span className="sm:hidden">{t('settings.organization')}</span>
              </TabsTrigger>
              <TabsTrigger value="master-data" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('settings.masterData')}</span>
                <span className="sm:hidden">{t('settings.masterDataShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('settings.communication')}</span>
                <span className="sm:hidden">{t('settings.communicationShort')}</span>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="demo-accounts" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('settings.demoAccounts')}</span>
                  <span className="sm:hidden">{t('settings.demoAccountsShort')}</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="profile" className="animate-in fade-in-50 slide-in-from-left-2 duration-200">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="organization" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            <OrganizationTab 
              activeSubTab={activeSubTabs['organization']} 
              onSubTabChange={(value) => setActiveSubTabs(prev => ({ ...prev, organization: value }))}
            />
          </TabsContent>

          <TabsContent value="master-data" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            <MasterDataTab
              activeSubTab={activeSubTabs['master-data']}
              onSubTabChange={(value) => setActiveSubTabs(prev => ({ ...prev, 'master-data': value }))}
              UnitsContent={UnitsTab}
              CategoriesContent={CategoriesTab}
            />
          </TabsContent>

          <TabsContent value="communication" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
            <CommunicationTab
              activeSubTab={activeSubTabs['communication']}
              onSubTabChange={(value) => setActiveSubTabs(prev => ({ ...prev, communication: value }))}
              NotificationsContent={NotificationsTab}
              EmailTemplatesContent={EmailTemplateTab}
              SupplierPortalContent={SupplierPortalTab}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="demo-accounts" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
              <DemoAccountsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const ProfileTab = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const updatePassword = useUpdatePassword();
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');


  const handleProfileSave = () => {
    if (fullName.trim()) {
      updateProfile.mutate({ full_name: fullName.trim() });
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError(t('validation.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('validation.passwordMismatch'));
      return;
    }

    updatePassword.mutate(
      { newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.profileInfo')}</CardTitle>
          <CardDescription>{t('settings.updateDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')}</Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">{t('settings.emailCannotChange')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name">{t('auth.fullName')}</Label>
            <Input
              id="full-name"
              defaultValue={profile?.full_name || ''}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('auth.fullName')}
            />
          </div>

          <Button onClick={handleProfileSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? t('settings.savingProfile') : t('settings.saveProfile')}
          </Button>

          <AdvancedSettingsSwitch />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {t('settings.changePassword')}
          </CardTitle>
          <CardDescription>{t('settings.passwordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.newPasswordPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('settings.confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('settings.confirmPasswordPlaceholder')}
                required
              />
            </div>

            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}

            <Button type="submit" disabled={updatePassword.isPending}>
              {updatePassword.isPending ? t('settings.updatingPassword') : t('settings.updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const AdvancedSettingsSwitch = () => {
  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  const handleToggle = (checked: boolean) => {
    setAdvancedMode(checked);
    localStorage.setItem('advanced-settings-enabled', checked.toString());
    window.dispatchEvent(new StorageEvent('storage', { key: 'advanced-settings-enabled', newValue: checked.toString() }));
  };

  const { t } = useTranslation();
  
  return (
    <div className="pt-4 border-t">
      <div className="flex items-center justify-between">
        <div>
          <Label className="mb-1 block">{t('settings.advancedSettings')}</Label>
          <p className="text-xs text-muted-foreground">
            {t('settings.advancedSettingsDesc')}
          </p>
        </div>
        <Switch 
          checked={advancedMode} 
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
};

interface OrganizationTabProps {
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
}

const OrganizationTab = ({ activeSubTab, onSubTabChange }: OrganizationTabProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.general')}</span>
            <span className="sm:hidden">{t('settings.generalShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>{t('settings.team')}</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('locations.title')}</span>
            <span className="sm:hidden">{t('settings.locationsShort')}</span>
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.addresses')}</span>
            <span className="sm:hidden">{t('settings.addressesShort')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 animate-in fade-in-50 slide-in-from-left-2 duration-200">
          <OrganizationGeneralContent />
        </TabsContent>

        <TabsContent value="team" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <TeamTab />
        </TabsContent>

        <TabsContent value="locations" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <LocationsTab />
        </TabsContent>

        <TabsContent value="addresses" className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
          <AddressesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const OrganizationGeneralContent = () => {
  const { t } = useTranslation();
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const [name, setName] = useState('');
  const [testModeEnabled, setTestModeEnabled] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testEmailError, setTestEmailError] = useState('');

  useState(() => {
    if (organization) {
      setTestModeEnabled(organization.test_mode_enabled || false);
      setTestEmail(organization.test_email || '');
    }
  });

  const handleSave = () => {
    if (organization && name.trim()) {
      updateOrganization.mutate({ id: organization.id, name: name.trim() });
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTestModeToggle = (enabled: boolean) => {
    if (!organization) return;
    
    if (enabled && !testEmail) {
      setTestEmailError(t('settings.testEmailError'));
      return;
    }

    if (enabled && testEmail && !validateEmail(testEmail)) {
      setTestEmailError(t('settings.testEmailInvalid'));
      return;
    }

    updateOrganization.mutate({
      id: organization.id,
      test_mode_enabled: enabled,
      test_email: testEmail || organization.test_email,
    });
  };

  const handleTestEmailSave = () => {
    if (!organization) return;
    
    if (!testEmail) {
      setTestEmailError(t('settings.testEmailRequired'));
      return;
    }

    if (!validateEmail(testEmail)) {
      setTestEmailError(t('settings.testEmailInvalid'));
      return;
    }

    updateOrganization.mutate({
      id: organization.id,
      test_email: testEmail,
    });
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.orgProfile')}</CardTitle>
          <CardDescription>{t('settings.orgDetails')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="org-name">{t('settings.orgName')}</Label>
            <Input
              id="org-name"
              defaultValue={organization?.name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.orgNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('settings.subscription')}</Label>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {organization?.subscription_tier || 'free'}
              </Badge>
              {organization?.trial_ends_at && (
                <span className="text-sm text-muted-foreground">
                  {t('settings.trialEnds')}: {new Date(organization.trial_ends_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateOrganization.isPending}>
            {updateOrganization.isPending ? t('settings.savingProfile') : t('settings.saveChanges')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('testMode.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.testModeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!organization?.is_demo && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="test-mode" className="text-base font-medium">
                  {t('settings.testModeEnable')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.testModeEnabledDesc')}
                </p>
              </div>
              <Switch
                id="test-mode"
                checked={organization?.test_mode_enabled || false}
                onCheckedChange={handleTestModeToggle}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="test-email">{t('settings.testEmailAddress')}</Label>
            <div className="flex gap-2">
              <Input
                id="test-email"
                type="email"
                value={testEmail || organization?.test_email || ''}
                onChange={(e) => {
                  setTestEmail(e.target.value);
                  setTestEmailError('');
                }}
                placeholder={t('settings.testEmailPlaceholder')}
                className="flex-1"
                disabled={organization?.is_demo}
              />
              {!organization?.is_demo && (
                <Button 
                  onClick={handleTestEmailSave} 
                  disabled={updateOrganization.isPending || !testEmail}
                  variant="outline"
                >
                  {t('common.save')}
                </Button>
              )}
            </div>
            {testEmailError && (
              <p className="text-sm text-destructive">{testEmailError}</p>
            )}
            {organization?.is_demo && (
              <p className="text-sm text-muted-foreground">
                {t('settings.demoModeNote')}
              </p>
            )}
          </div>

          {organization?.test_mode_enabled && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">{t('settings.testModeActive')}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t('settings.testModeActiveDesc', { email: organization.test_email })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TeamTab = () => {
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('settings.teamMembers')}</CardTitle>
            <CardDescription>{t('settings.teamDescription')}</CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('settings.inviteMember')}
                </Button>
              </DialogTrigger>
              <DialogContent>
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
          )}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t('settings.noMembers')}</p>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.full_name || t('settings.noName')}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && member.id !== user?.id ? (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(role) => updateRole.mutate({ userId: member.id, role: role as TeamMember['role'] })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="purchaser">Purchaser</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
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
        </CardContent>
      </Card>

      {isAdmin && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('settings.pendingInvitations')}
            </CardTitle>
            <CardDescription>{t('settings.pendingDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">{invitation.email}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                    onClick={() => deleteInvitation.mutate(invitation.id)}
                    disabled={deleteInvitation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const AddressesTab = () => {
  const { t } = useTranslation();
  const { activeLocation } = useLocationContext();
  const { data: addresses = [], isLoading } = useDeliveryAddresses(activeLocation?.id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);

  const handleEdit = (address: DeliveryAddress) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('settings.deliveryAddresses')}</CardTitle>
          <CardDescription>
            {t('settings.addressDescription', { location: activeLocation?.name || t('locations.title') })}
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('settings.addAddress')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? t('settings.editAddress') : t('settings.addAddress')}</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={editingAddress}
              locationId={activeLocation?.id || null}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('settings.noAddresses', { location: activeLocation?.name || t('locations.title') })}
          </p>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <AddressCard key={address.id} address={address} onEdit={() => handleEdit(address)} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AddressCard = ({ address, onEdit }: { address: DeliveryAddress; onEdit: () => void }) => {
  const { t } = useTranslation();
  const deleteAddress = useDeleteDeliveryAddress();
  const updateAddress = useUpdateDeliveryAddress();

  return (
    <div className="flex items-start justify-between p-4 border rounded-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{address.label}</span>
          {address.is_default && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3" />
              {t('settings.defaultAddress')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {address.address_line1}
          {address.address_line2 && `, ${address.address_line2}`}
        </p>
        <p className="text-sm text-muted-foreground">
          {address.postal_code} {address.city}, {address.country}
        </p>
      </div>
      <div className="flex gap-2">
        {!address.is_default && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateAddress.mutate({ id: address.id, is_default: true })}
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteAddress.mutate(address.id)}
          disabled={deleteAddress.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

const AddressForm = ({
  address,
  locationId,
  onSuccess,
}: {
  address: DeliveryAddress | null;
  locationId: string | null;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const createAddress = useCreateDeliveryAddress();
  const updateAddress = useUpdateDeliveryAddress();
  const [formData, setFormData] = useState({
    label: address?.label || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    postal_code: address?.postal_code || '',
    city: address?.city || '',
    country: address?.country || 'Germany',
    is_default: address?.is_default || false,
  });

  const isPending = createAddress.isPending || updateAddress.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address) {
      updateAddress.mutate({ id: address.id, ...formData }, { onSuccess });
    } else {
      createAddress.mutate({ ...formData, location_id: locationId }, { onSuccess });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">{t('settings.addressLabel')}</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder={t('settings.addressLabelPlaceholder')}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line1">{t('settings.addressLine1')}</Label>
        <Input
          id="address_line1"
          value={formData.address_line1}
          onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
          placeholder={t('settings.addressLine1Placeholder')}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line2">{t('settings.addressLine2')}</Label>
        <Input
          id="address_line2"
          value={formData.address_line2}
          onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
          placeholder={t('settings.addressLine2Placeholder')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">{t('settings.postalCode')}</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t('settings.city')}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">{t('settings.country')}</Label>
        <Input
          id="country"
          value={formData.country}
          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          required
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="is_default"
          checked={formData.is_default}
          onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
        />
        <Label htmlFor="is_default">{t('settings.setAsDefault')}</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t('settings.savingProfile') : address ? t('settings.updateAddress') : t('settings.addAddress')}
      </Button>
    </form>
  );
};

const NotificationsTab = () => {
  const { t } = useTranslation();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const upsertPreferences = useUpsertNotificationPreferences();
  const [prefs, setPrefs] = useState({
    email_order_confirmation: true,
    email_order_status: true,
    email_weekly_report: false,
    email_supplier_updates: true,
  });

  useState(() => {
    if (preferences) {
      setPrefs({
        email_order_confirmation: preferences.email_order_confirmation,
        email_order_status: preferences.email_order_status,
        email_weekly_report: preferences.email_weekly_report,
        email_supplier_updates: preferences.email_supplier_updates,
      });
    }
  });

  const handleToggle = (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    upsertPreferences.mutate(newPrefs);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  const currentPrefs = preferences || prefs;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.notificationPrefs')}</CardTitle>
        <CardDescription>{t('settings.notificationDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.orderConfirmation')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.orderConfirmationDesc')}</p>
            </div>
            <Switch
              checked={currentPrefs.email_order_confirmation}
              onCheckedChange={() => handleToggle('email_order_confirmation')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.orderStatus')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.orderStatusDesc')}</p>
            </div>
            <Switch
              checked={currentPrefs.email_order_status}
              onCheckedChange={() => handleToggle('email_order_status')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.weeklyReport')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.weeklyReportDesc')}</p>
            </div>
            <Switch
              checked={currentPrefs.email_weekly_report}
              onCheckedChange={() => handleToggle('email_weekly_report')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('settings.supplierUpdates')}</Label>
              <p className="text-sm text-muted-foreground">{t('settings.supplierUpdatesDesc')}</p>
            </div>
            <Switch
              checked={currentPrefs.email_supplier_updates}
              onCheckedChange={() => handleToggle('email_supplier_updates')}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EmailTemplateTab = () => {
  const { t } = useTranslation();
  const { data: template, isLoading } = useEmailTemplate();
  const upsertTemplate = useUpsertEmailTemplate();
  const defaultTemplate = getDefaultTemplate();

  const [formData, setFormData] = useState({
    subject_template: '',
    greeting: '',
    introduction: '',
    closing: '',
    signature: '',
    article_list_format: '',
    design_style: 'modern' as 'modern' | 'classic' | 'minimalist',
    footer_text: '',
    footer_logo_url: '',
    show_powered_by: true,
  });

  useState(() => {
    if (template) {
      setFormData({
        subject_template: template.subject_template,
        greeting: template.greeting,
        introduction: template.introduction,
        closing: template.closing,
        signature: template.signature,
        article_list_format: template.article_list_format,
        design_style: template.design_style || 'modern',
        footer_text: template.footer_text || '',
        footer_logo_url: template.footer_logo_url || '',
        show_powered_by: template.show_powered_by ?? true,
      });
    } else {
      setFormData({
        subject_template: defaultTemplate.subject_template || '',
        greeting: defaultTemplate.greeting || '',
        introduction: defaultTemplate.introduction || '',
        closing: defaultTemplate.closing || '',
        signature: defaultTemplate.signature || '',
        article_list_format: defaultTemplate.article_list_format || '',
        design_style: defaultTemplate.design_style || 'modern',
        footer_text: defaultTemplate.footer_text || '',
        footer_logo_url: defaultTemplate.footer_logo_url || '',
        show_powered_by: defaultTemplate.show_powered_by ?? true,
      });
    }
  });

  const currentData = template ? {
    subject_template: template.subject_template,
    greeting: template.greeting,
    introduction: template.introduction,
    closing: template.closing,
    signature: template.signature,
    article_list_format: template.article_list_format,
    design_style: template.design_style || 'modern',
    footer_text: template.footer_text || '',
    footer_logo_url: template.footer_logo_url || '',
    show_powered_by: template.show_powered_by ?? true,
  } : formData;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDesignChange = (design: 'modern' | 'classic' | 'minimalist') => {
    setFormData(prev => ({ ...prev, design_style: design }));
  };

  const handleSave = () => {
    upsertTemplate.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      subject_template: defaultTemplate.subject_template || '',
      greeting: defaultTemplate.greeting || '',
      introduction: defaultTemplate.introduction || '',
      closing: defaultTemplate.closing || '',
      signature: defaultTemplate.signature || '',
      article_list_format: defaultTemplate.article_list_format || '',
      design_style: defaultTemplate.design_style || 'modern',
      footer_text: defaultTemplate.footer_text || '',
      footer_logo_url: defaultTemplate.footer_logo_url || '',
      show_powered_by: defaultTemplate.show_powered_by ?? true,
    });
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  const designOptions = [
    {
      id: 'modern' as const,
      name: t('settings.emailDesignModern'),
      description: t('settings.emailDesignModernDesc'),
      preview: 'bg-gradient-to-r from-[#1e3a5f] to-[#2563eb]',
    },
    {
      id: 'classic' as const,
      name: t('settings.emailDesignClassic'),
      description: t('settings.emailDesignClassicDesc'),
      preview: 'bg-[#1e3a5f]',
    },
    {
      id: 'minimalist' as const,
      name: t('settings.emailDesignMinimalist'),
      description: t('settings.emailDesignMinimalistDesc'),
      preview: 'bg-muted border',
    },
  ];

  const selectedDesign = formData.design_style || currentData.design_style || 'modern';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.emailFooter')}
          </CardTitle>
          <CardDescription>{t('settings.emailFooterDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-powered-by">{t('settings.showPoweredBy')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.showPoweredByDesc')}</p>
            </div>
            <Switch
              id="show-powered-by"
              checked={formData.show_powered_by ?? currentData.show_powered_by ?? true}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_powered_by: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-text">{t('settings.customFooterText')}</Label>
            <Input
              id="footer-text"
              value={formData.footer_text || currentData.footer_text || ''}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              placeholder={t('settings.customFooterTextPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('settings.customFooterTextHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-logo-url">{t('settings.footerLogoUrl')}</Label>
            <Input
              id="footer-logo-url"
              value={formData.footer_logo_url || currentData.footer_logo_url || ''}
              onChange={(e) => handleChange('footer_logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">{t('settings.footerLogoUrlHint')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('settings.emailDesign')}
          </CardTitle>
          <CardDescription>{t('settings.emailDesignDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {designOptions.map((design) => (
              <div
                key={design.id}
                onClick={() => handleDesignChange(design.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedDesign === design.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className={`h-20 rounded-md mb-3 ${design.preview}`} />
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{design.name}</h4>
                  {selectedDesign === design.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{design.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.emailTemplateTitle')}
          </CardTitle>
          <CardDescription>{t('settings.emailTemplateDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject-template">{t('settings.subjectTemplate')}</Label>
            <Input
              id="subject-template"
              value={formData.subject_template || currentData.subject_template}
              onChange={(e) => handleChange('subject_template', e.target.value)}
              placeholder="Neue Bestellung von {restaurant_name}"
            />
            <p className="text-xs text-muted-foreground">{t('settings.subjectTemplateHelp')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="greeting">{t('settings.greeting')}</Label>
            <Input
              id="greeting"
              value={formData.greeting || currentData.greeting}
              onChange={(e) => handleChange('greeting', e.target.value)}
              placeholder="Guten Tag,"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="introduction">{t('settings.introduction')}</Label>
            <Textarea
              id="introduction"
              value={formData.introduction || currentData.introduction}
              onChange={(e) => handleChange('introduction', e.target.value)}
              placeholder="hiermit senden wir Ihnen unsere Bestellung:"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing">{t('settings.closing')}</Label>
            <Textarea
              id="closing"
              value={formData.closing || currentData.closing}
              onChange={(e) => handleChange('closing', e.target.value)}
              placeholder="Vielen Dank für Ihre Zusammenarbeit."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">{t('settings.signature')}</Label>
            <Textarea
              id="signature"
              value={formData.signature || currentData.signature}
              onChange={(e) => handleChange('signature', e.target.value)}
              placeholder="Mit freundlichen Grüßen,&#10;{restaurant_name}"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{t('settings.signatureHelp')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-list-format">{t('settings.articleListFormat')}</Label>
            <Textarea
              id="article-list-format"
              value={formData.article_list_format || currentData.article_list_format}
              onChange={(e) => handleChange('article_list_format', e.target.value)}
              placeholder="- {article_name}{sku_suffix}: {quantity} {unit} à €{unit_price} = €{total_price}"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">{t('settings.articleListFormatHelp')}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={upsertTemplate.isPending}>
              {upsertTemplate.isPending ? t('common.saving') : t('common.save')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('settings.resetToDefault')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UnitsTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: units = [], isLoading: unitsLoading } = useUnits();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const [newUnitName, setNewUnitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingAll, setIsAddingAll] = useState(false);

  const dbUnitNames = new Set(units.map(u => u.name.toLowerCase()));
  const articleUnits = [...new Set(articles.map(a => a.unit).filter(Boolean))]
    .filter(unit => !dbUnitNames.has(unit.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'de'));

  const filteredDbUnits = units
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const filteredArticleUnits = articleUnits
    .filter(u => u.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddAllUnits = async () => {
    if (articleUnits.length === 0) return;
    
    setIsAddingAll(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const unitsToAdd = articleUnits.map(name => ({
        name,
        organization_id: profile.organization_id,
      }));

      const { error } = await supabase
        .from('units')
        .insert(unitsToAdd);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success(t('settings.unitsAddedSuccess', { count: articleUnits.length }));
    } catch (error) {
      toast.error(t('settings.unitsAddError'));
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleAddUnit = (name?: string) => {
    const unitName = name || newUnitName;
    if (unitName.trim()) {
      createUnit.mutate(unitName.trim(), {
        onSuccess: () => setNewUnitName(''),
      });
    }
  };

  const handleStartEdit = (unit: { id: string; name: string }) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateUnit.mutate({ id: editingId, name: editingName.trim() }, {
        onSuccess: () => {
          setEditingId(null);
          setEditingName('');
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: string) => {
    if (confirm(t('settings.deleteUnitConfirm'))) {
      deleteUnit.mutate(id);
    }
  };

  const isLoading = unitsLoading || articlesLoading;

  if (isLoading) {
    return <Card><CardContent className="p-6">Lädt...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Einheiten verwalten
        </CardTitle>
        <CardDescription>Erstellen und verwalten Sie Ihre Mengeneinheiten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            placeholder="Neue Einheit hinzufügen..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
          />
          <Button onClick={() => handleAddUnit()} disabled={createUnit.isPending || !newUnitName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        <div>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Einheiten suchen..."
            className="mb-4"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.savedUnits')} ({filteredDbUnits.length})</h3>
          {filteredDbUnits.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">{t('settings.noSavedUnits')}</p>
          ) : (
            filteredDbUnits.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                {editingId === unit.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateUnit.isPending}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{unit.name}</span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit(unit)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(unit.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {filteredArticleUnits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{t('settings.unitsFromArticles')} ({articleUnits.length})</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddAllUnits}
                disabled={isAddingAll}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingAll ? t('settings.addingAll') : t('settings.addAll')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('settings.unitsFromArticlesDesc')}</p>
            <div className="flex flex-wrap gap-2">
              {filteredArticleUnits.map((unit) => (
                <Badge 
                  key={unit} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleAddUnit(unit)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {unit}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LocationsTab = () => {
  const { t } = useTranslation();
  const { data: locations = [], isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const deleteLocation = useDeleteLocation();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setName(location.name);
      setShortCode(location.short_code || '');
      setIsDefault(location.is_default);
    } else {
      setEditingLocation(null);
      setName('');
      setShortCode('');
      setIsDefault(false);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (editingLocation) {
      updateLocation.mutate({
        id: editingLocation.id,
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        is_default: isDefault,
      }, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      createLocation.mutate({
        name: name.trim(),
        short_code: shortCode.trim() || undefined,
        is_default: isDefault,
      }, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t('settings.deleteLocationConfirm'))) {
      deleteLocation.mutate(id);
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t('settings.manageLocations')}
          </CardTitle>
          <CardDescription>
            {t('settings.manageLocationsDesc')}
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              {t('settings.addLocation')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? t('settings.editLocation') : t('settings.createLocation')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location-name">{t('settings.locationName')} *</Label>
                <Input
                  id="location-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('settings.locationNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-code">{t('settings.locationCode')}</Label>
                <Input
                  id="location-code"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder={t('settings.locationCodePlaceholder')}
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground">{t('settings.locationCodeDesc')}</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is-default">{t('settings.defaultLocation')}</Label>
                  <p className="text-xs text-muted-foreground">{t('settings.defaultLocationDesc')}</p>
                </div>
                <Switch
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createLocation.isPending || updateLocation.isPending}>
                {(createLocation.isPending || updateLocation.isPending) ? t('settings.savingProfile') : t('common.save')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('settings.noLocations')}
          </p>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <div 
                key={location.id} 
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{location.name}</p>
                      {location.short_code && (
                        <Badge variant="outline" className="text-xs">
                          {location.short_code}
                        </Badge>
                      )}
                      {location.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {t('settings.defaultAddress')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(location)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {!location.is_default && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(location.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CategoriesTab = () => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const { data: articles = [] } = useArticles();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const [mergingCategory, setMergingCategory] = useState<{ id: string; name: string } | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);

  const articleCategories = [...new Set(articles?.map((a) => a.category).filter(Boolean) || [])] as string[];
  const dbCategoryNames = categories.map(c => c.name);
  const missingCategories = articleCategories.filter(c => !dbCategoryNames.includes(c));

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategory.mutate(newCategoryName.trim(), {
      onSuccess: () => setNewCategoryName(''),
    });
  };

  const handleStartEdit = (category: { id: string; name: string }) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    updateCategory.mutate(
      { id: editingId, name: editingName.trim() },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => setDeletingCategory(null),
    });
  };

  const handleAddMissingCategory = (name: string) => {
    createCategory.mutate(name);
  };

  const handleAddAllMissingCategories = () => {
    missingCategories.forEach((name) => {
      createCategory.mutate(name);
    });
  };

  const handleMergeConfirm = async () => {
    if (!mergingCategory || !mergeTargetId) return;
    
    const targetCategory = categories.find(c => c.id === mergeTargetId);
    if (!targetCategory) return;

    setIsMerging(true);
    try {
      const { error: updateError } = await supabase
        .from('articles')
        .update({ category: targetCategory.name })
        .eq('category', mergingCategory.name);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', mergingCategory.id);

      if (deleteError) throw deleteError;

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });

      toast.success(t('settings.categoriesMergedSuccess', { source: mergingCategory.name, target: targetCategory.name }));
      setMergingCategory(null);
      setMergeTargetId('');
    } catch (error) {
      toast.error(t('settings.categoriesMergeError'));
    } finally {
      setIsMerging(false);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => 
    a.name.localeCompare(b.name, 'de')
  );

  const mergeTargets = sortedCategories.filter(c => c.id !== mergingCategory?.id);

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {t('settings.manageCategories')}
        </CardTitle>
        <CardDescription>
          {t('settings.manageCategoriesDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder={t('settings.newCategoryPlaceholder')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory} disabled={createCategory.isPending || !newCategoryName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.add')}
          </Button>
        </div>

        {missingCategories.length > 0 && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{t('settings.categoriesFromArticles')}</h4>
                <p className="text-xs text-muted-foreground">{t('settings.categoriesFromArticlesDesc')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddAllMissingCategories}>
                <Plus className="h-4 w-4 mr-2" />
                {t('settings.addAll')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleAddMissingCategory(cat)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sortedCategories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('settings.noCategories')}
          </p>
        ) : (
          <div className="space-y-2">
            {sortedCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                {editingId === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMergingCategory({ id: category.id, name: category.name });
                          setMergeTargetId('');
                        }}
                        title="Zusammenführen"
                        disabled={sortedCategories.length < 2}
                      >
                        <Merge className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingCategory({ id: category.id, name: category.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteCategoryTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deleteCategoryConfirm', { name: deletingCategory?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!mergingCategory} onOpenChange={(open) => !open && setMergingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.mergeCategoriesTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                {t('settings.mergeCategoriesDesc', { name: mergingCategory?.name })}
              </p>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.selectTargetCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {mergeTargets.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMergeConfirm}
              disabled={!mergeTargetId || isMerging}
            >
              {isMerging ? t('settings.merging') : t('settings.merge')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

const SupplierPortalTab = () => {
  const { data: settings, isLoading, refetch } = useSupplierPortalSettings();
  const upsertSettings = useUpsertSupplierPortalSettings();
  
  const [portalTitle, setPortalTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [infoText, setInfoText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setPortalTitle(settings.portal_title);
    setWelcomeMessage(settings.welcome_message || '');
    setCardTitle(settings.card_title);
    setCardDescription(settings.card_description);
    setInfoText(settings.info_text || '');
    setFooterText(settings.footer_text || '');
    setLogoUrl(settings.logo_url || null);
    setInitialized(true);
  } else if (!settings && !isLoading && !initialized) {
    setPortalTitle(DEFAULT_PORTAL_SETTINGS.portal_title);
    setWelcomeMessage('');
    setCardTitle(DEFAULT_PORTAL_SETTINGS.card_title);
    setCardDescription(DEFAULT_PORTAL_SETTINGS.card_description);
    setInfoText('');
    setFooterText('');
    setLogoUrl(null);
    setInitialized(true);
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei aus');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Die Datei ist zu groß. Maximale Größe: 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.organization_id}/logo-${Date.now()}.${fileExt}`;

      if (logoUrl) {
        const oldPath = logoUrl.split('/portal-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('portal-logos').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('portal-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal-logos')
        .getPublicUrl(fileName);

      await upsertSettings.mutateAsync({ logo_url: publicUrl });
      setLogoUrl(publicUrl);
      toast.success('Logo erfolgreich hochgeladen');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Fehler beim Hochladen: ' + error.message);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      const path = logoUrl.split('/portal-logos/')[1];
      if (path) {
        await supabase.storage.from('portal-logos').remove([path]);
      }

      await upsertSettings.mutateAsync({ logo_url: null });
      setLogoUrl(null);
      toast.success('Logo entfernt');
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error('Fehler beim Entfernen: ' + error.message);
    }
  };

  const handleSave = () => {
    upsertSettings.mutate({
      portal_title: portalTitle,
      welcome_message: welcomeMessage || null,
      card_title: cardTitle,
      card_description: cardDescription,
      info_text: infoText || null,
      footer_text: footerText || null,
    });
  };

  const handleReset = () => {
    setPortalTitle(DEFAULT_PORTAL_SETTINGS.portal_title);
    setWelcomeMessage('');
    setCardTitle(DEFAULT_PORTAL_SETTINGS.card_title);
    setCardDescription(DEFAULT_PORTAL_SETTINGS.card_description);
    setInfoText('');
    setFooterText('');
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Lädt...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Portal-Vorschau
          </CardTitle>
          <CardDescription>
            So sieht das Portal für Lieferanten aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PortalPreview
            logoUrl={logoUrl}
            portalTitle={portalTitle}
            welcomeMessage={welcomeMessage}
            cardTitle={cardTitle}
            cardDescription={cardDescription}
            infoText={infoText}
            footerText={footerText}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Lieferantenportal-Texte
          </CardTitle>
          <CardDescription>
            Passen Sie die Texte an, die Lieferanten im Portal sehen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Portal-Logo
            </Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Portal Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="logo-upload">
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLogo}
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {logoUrl ? 'Logo ändern' : 'Logo hochladen'}
                    </Button>
                  </label>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Entfernen
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max. 2MB. Wird im Portal-Header angezeigt.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 mt-4" />

          <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Markdown-Formatierung unterstützt:</p>
            <p>**fett** • *kursiv* • [Link](https://example.com) • - Listen</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portal-title">Portal-Titel</Label>
              <Input
                id="portal-title"
                value={portalTitle}
                onChange={(e) => setPortalTitle(e.target.value)}
                placeholder="z.B. Lieferantenportal"
              />
              <p className="text-xs text-muted-foreground">
                Wird als Hauptüberschrift im Header angezeigt
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcome-message">Willkommensnachricht (optional)</Label>
              <Textarea
                id="welcome-message"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="z.B. Willkommen im Lieferantenportal! Hier können Sie Ihre Artikelinformationen verwalten."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Wird unter dem Header als Einführungstext angezeigt. Markdown wird unterstützt.
              </p>
              {welcomeMessage && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Vorschau:</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {welcomeMessage}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-4">Artikel-Bereich</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-title">Bereichs-Titel</Label>
                  <Input
                    id="card-title"
                    value={cardTitle}
                    onChange={(e) => setCardTitle(e.target.value)}
                    placeholder="z.B. Meine Artikel"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card-description">Bereichs-Beschreibung</Label>
                  <Input
                    id="card-description"
                    value={cardDescription}
                    onChange={(e) => setCardDescription(e.target.value)}
                    placeholder="z.B. Änderungen werden zur Genehmigung eingereicht."
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-4">Zusätzliche Texte</p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="info-text">Info-Text (optional)</Label>
                  <Textarea
                    id="info-text"
                    value={infoText}
                    onChange={(e) => setInfoText(e.target.value)}
                    placeholder="z.B. Bitte aktualisieren Sie Ihre Preise regelmäßig. Bei Fragen kontaktieren Sie uns unter support@restaurant.de"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird als Hinweisbox über der Artikelliste angezeigt. Markdown wird unterstützt.
                  </p>
                  {infoText && (
                    <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Vorschau:</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {infoText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-text">Footer-Text (optional)</Label>
                  <Textarea
                    id="footer-text"
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="z.B. © 2024 Mein Restaurant - Kontakt: lieferanten@restaurant.de"
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird am Ende der Seite angezeigt. Markdown wird unterstützt.
                  </p>
                  {footerText && (
                    <div className="mt-2 p-3 bg-muted/30 rounded-lg text-center">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Vorschau:</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none mx-auto">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {footerText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={upsertSettings.isPending}>
              {upsertSettings.isPending ? 'Speichern...' : 'Speichern'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Auf Standardwerte zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
