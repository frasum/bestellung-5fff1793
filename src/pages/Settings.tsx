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
import { Building2, MapPin, Bell, Plus, Pencil, Trash2, Star, User, Lock, Users, Mail, Clock, X, Globe, FileText, RotateCcw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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
import { useEmailTemplate, useUpsertEmailTemplate, getDefaultTemplate } from '@/hooks/useEmailTemplates';

const Settings = () => {
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
          <p className="text-muted-foreground">{t('settings.description')}</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              {t('settings.profile')}
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              {t('settings.organization')}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              {t('settings.team')}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="h-4 w-4" />
              {t('settings.addresses')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              {t('settings.notifications')}
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="gap-2">
              <FileText className="h-4 w-4" />
              {t('settings.emailTemplates')}
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2">
              <Globe className="h-4 w-4" />
              {t('settings.language')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="organization">
            <OrganizationTab />
          </TabsContent>

          <TabsContent value="team">
            <TeamTab />
          </TabsContent>

          <TabsContent value="addresses">
            <AddressesTab />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>

          <TabsContent value="email-templates">
            <EmailTemplateTab />
          </TabsContent>

          <TabsContent value="language">
            <LanguageTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const ProfileTab = () => {
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
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
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
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              defaultValue={profile?.full_name || ''}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <Button onClick={handleProfileSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>

            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}

            <Button type="submit" disabled={updatePassword.isPending}>
              {updatePassword.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const OrganizationTab = () => {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (organization && name.trim()) {
      updateOrganization.mutate({ id: organization.id, name: name.trim() });
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>Manage your organization details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            defaultValue={organization?.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter organization name"
          />
        </div>

        <div className="space-y-2">
          <Label>Subscription</Label>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {organization?.subscription_tier || 'free'}
            </Badge>
            {organization?.trial_ends_at && (
              <span className="text-sm text-muted-foreground">
                Trial ends: {new Date(organization.trial_ends_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateOrganization.isPending}>
          {updateOrganization.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

const TeamTab = () => {
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
    admin: 'Admin',
    manager: 'Manager',
    purchaser: 'Purchaser',
    viewer: 'Viewer',
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage your organization's team members</CardDescription>
          </div>
          {isAdmin && (
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamMember['role'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - Can view orders and articles</SelectItem>
                        <SelectItem value="purchaser">Purchaser - Can place orders</SelectItem>
                        <SelectItem value="manager">Manager - Can manage suppliers and articles</SelectItem>
                        <SelectItem value="admin">Admin - Full access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={createInvitation.isPending}>
                    {createInvitation.isPending ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No team members yet.</p>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{member.full_name || 'No name'}</p>
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
                      <Badge variant="outline">You</Badge>
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
              Pending Invitations
            </CardTitle>
            <CardDescription>Invitations waiting to be accepted</CardDescription>
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
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
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
  const { data: addresses = [], isLoading } = useDeliveryAddresses();
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
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Delivery Addresses</CardTitle>
          <CardDescription>Manage your organization's delivery addresses</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit Address' : 'Add Address'}</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={editingAddress}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No addresses yet. Add your first delivery address.</p>
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
              Default
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
            Set Default
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => deleteAddress.mutate(address.id)}
          disabled={deleteAddress.isPending}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
};

const AddressForm = ({ address, onSuccess }: { address: DeliveryAddress | null; onSuccess: () => void }) => {
  const createAddress = useCreateDeliveryAddress();
  const updateAddress = useUpdateDeliveryAddress();
  const [formData, setFormData] = useState({
    label: address?.label || '',
    address_line1: address?.address_line1 || '',
    address_line2: address?.address_line2 || '',
    city: address?.city || '',
    postal_code: address?.postal_code || '',
    country: address?.country || 'Germany',
    is_default: address?.is_default || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address) {
      updateAddress.mutate({ id: address.id, ...formData }, { onSuccess });
    } else {
      createAddress.mutate(formData, { onSuccess });
    }
  };

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="e.g., Main Kitchen"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line1">Address Line 1</Label>
        <Input
          id="address_line1"
          value={formData.address_line1}
          onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
          placeholder="Street and number"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address_line2">Address Line 2</Label>
        <Input
          id="address_line2"
          value={formData.address_line2}
          onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
          placeholder="Building, floor, etc. (optional)"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
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
        <Label htmlFor="is_default">Set as default address</Label>
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
      </Button>
    </form>
  );
};

const NotificationsTab = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const upsertPreferences = useUpsertNotificationPreferences();
  const [prefs, setPrefs] = useState({
    email_order_confirmation: true,
    email_order_status: true,
    email_weekly_report: false,
    email_supplier_updates: true,
  });

  // Update local state when data loads
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
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  const currentPrefs = preferences || prefs;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose what notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Confirmations</Label>
              <p className="text-sm text-muted-foreground">Receive email when orders are placed</p>
            </div>
            <Switch
              checked={currentPrefs.email_order_confirmation}
              onCheckedChange={() => handleToggle('email_order_confirmation')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Order Status Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified when order status changes</p>
            </div>
            <Switch
              checked={currentPrefs.email_order_status}
              onCheckedChange={() => handleToggle('email_order_status')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">Receive weekly spending summaries</p>
            </div>
            <Switch
              checked={currentPrefs.email_weekly_report}
              onCheckedChange={() => handleToggle('email_weekly_report')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Supplier Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about supplier changes</p>
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

const LanguageTab = () => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('language.selectLanguage')}
        </CardTitle>
        <CardDescription>{t('settings.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                i18n.language === lang.code
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
            </button>
          ))}
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
  });

  // Initialize form with template data or defaults
  useState(() => {
    if (template) {
      setFormData({
        subject_template: template.subject_template,
        greeting: template.greeting,
        introduction: template.introduction,
        closing: template.closing,
        signature: template.signature,
      });
    } else {
      setFormData({
        subject_template: defaultTemplate.subject_template || '',
        greeting: defaultTemplate.greeting || '',
        introduction: defaultTemplate.introduction || '',
        closing: defaultTemplate.closing || '',
        signature: defaultTemplate.signature || '',
      });
    }
  });

  const currentData = template ? {
    subject_template: template.subject_template,
    greeting: template.greeting,
    introduction: template.introduction,
    closing: template.closing,
    signature: template.signature,
  } : formData;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    });
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
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
  );
};

export default Settings;
