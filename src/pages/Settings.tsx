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
import { Building2, MapPin, Bell, Plus, Pencil, Trash2, Star, User, Lock, Users, Mail, Clock, X, Globe, FileText, RotateCcw, Moon, Sun, Ruler, Check, Store, Merge } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Textarea } from '@/components/ui/textarea';
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
            <TabsTrigger value="units" className="gap-2">
              <Ruler className="h-4 w-4" />
              Einheiten
            </TabsTrigger>
            <TabsTrigger value="locations" className="gap-2">
              <Store className="h-4 w-4" />
              Standorte
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tag className="h-4 w-4" />
              Kategorien
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

          <TabsContent value="units">
            <UnitsTab />
          </TabsContent>

          <TabsContent value="locations">
            <LocationsTab />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const ProfileTab = () => {
  const { t, i18n } = useTranslation();
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const updatePassword = useUpdatePassword();
  const { theme, setTheme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const languages = [
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

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

          <div className="pt-4 border-t">
            <Label className="mb-3 block">Theme</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className="gap-2"
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className="gap-2"
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
              >
                System
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="mb-3 block flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('language.selectLanguage')}
            </Label>
            <div className="flex gap-2 flex-wrap">
              {languages.map((lang) => (
                <Button
                  key={lang.code}
                  variant={i18n.language === lang.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => i18n.changeLanguage(lang.code)}
                  className="gap-2"
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </Button>
              ))}
            </div>
          </div>
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
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Delivery Addresses</CardTitle>
          <CardDescription>
            Lieferadressen für {activeLocation?.name || 'diesen Standort'} verwalten
          </CardDescription>
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
              locationId={activeLocation?.id || null}
              onSuccess={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Noch keine Adressen für {activeLocation?.name || 'diesen Standort'}. Füge die erste Lieferadresse hinzu.
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

const AddressForm = ({ address, locationId, onSuccess }: { address: DeliveryAddress | null; locationId: string | null; onSuccess: () => void }) => {
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
    location_id: address?.location_id || locationId,
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
        article_list_format: template.article_list_format,
      });
    } else {
      setFormData({
        subject_template: defaultTemplate.subject_template || '',
        greeting: defaultTemplate.greeting || '',
        introduction: defaultTemplate.introduction || '',
        closing: defaultTemplate.closing || '',
        signature: defaultTemplate.signature || '',
        article_list_format: defaultTemplate.article_list_format || '',
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
      article_list_format: defaultTemplate.article_list_format || '',
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
  );
};

const UnitsTab = () => {
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

  // Get unique units from articles that are not in the database
  const dbUnitNames = new Set(units.map(u => u.name.toLowerCase()));
  const articleUnits = [...new Set(articles.map(a => a.unit).filter(Boolean))]
    .filter(unit => !dbUnitNames.has(unit.toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  // Filter units based on search
  const filteredDbUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredArticleUnits = articleUnits.filter(u => 
    u.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAllUnits = async () => {
    if (articleUnits.length === 0) return;
    
    setIsAddingAll(true);
    try {
      // Get user's organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) {
        toast.error('Keine Organisation gefunden');
        return;
      }

      // Insert all units at once
      const unitsToInsert = articleUnits.map(name => ({
        name,
        organization_id: profile.organization_id,
      }));

      const { error } = await supabase
        .from('units')
        .insert(unitsToInsert);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success(`${articleUnits.length} Einheiten hinzugefügt`);
    } catch (error: any) {
      toast.error('Fehler beim Hinzufügen: ' + error.message);
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleAddUnit = (unitName?: string) => {
    const name = unitName || newUnitName;
    if (name.trim()) {
      createUnit.mutate(name.trim(), {
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
    if (confirm('Einheit wirklich löschen?')) {
      deleteUnit.mutate(id);
    }
  };

  const isLoading = unitsLoading || articlesLoading;

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
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

        {/* Database Units */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Gespeicherte Einheiten ({filteredDbUnits.length})</h3>
          {filteredDbUnits.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">Keine gespeicherten Einheiten</p>
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

        {/* Units from Articles (not yet in database) */}
        {filteredArticleUnits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Einheiten aus Artikeln ({articleUnits.length})</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddAllUnits}
                disabled={isAddingAll}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingAll ? 'Wird hinzugefügt...' : 'Alle hinzufügen'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Diese Einheiten werden in Artikeln verwendet, aber noch nicht zentral gespeichert.</p>
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
    if (confirm('Standort wirklich löschen?')) {
      deleteLocation.mutate(id);
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">Laden...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Standorte
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihre Restaurant-Standorte. Jeder Standort kann eigene Kundennummern und Lieferadressen haben.
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4" />
              Standort hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Standort bearbeiten' : 'Neuen Standort erstellen'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location-name">Name *</Label>
                <Input
                  id="location-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Restaurant Hauptstraße"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location-code">Kürzel (optional)</Label>
                <Input
                  id="location-code"
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder="z.B. HS"
                  maxLength={5}
                />
                <p className="text-xs text-muted-foreground">Wird in der Navigation angezeigt</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="is-default">Standard-Standort</Label>
                  <p className="text-xs text-muted-foreground">Wird automatisch beim Anmelden ausgewählt</p>
                </div>
                <Switch
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={createLocation.isPending || updateLocation.isPending}>
                {(createLocation.isPending || updateLocation.isPending) ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Noch keine Standorte angelegt.
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
                          Standard
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

  // Get categories from articles that are not in the database
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
      // Update all articles from source category to target category
      const { error: updateError } = await supabase
        .from('articles')
        .update({ category: targetCategory.name })
        .eq('category', mergingCategory.name);

      if (updateError) throw updateError;

      // Delete the source category
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', mergingCategory.id);

      if (deleteError) throw deleteError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });

      toast.success(`"${mergingCategory.name}" wurde mit "${targetCategory.name}" zusammengeführt`);
      setMergingCategory(null);
      setMergeTargetId('');
    } catch (error) {
      toast.error('Fehler beim Zusammenführen der Kategorien');
    } finally {
      setIsMerging(false);
    }
  };

  // Sort categories alphabetically
  const sortedCategories = [...categories].sort((a, b) => 
    a.name.localeCompare(b.name, 'de')
  );

  // Available merge targets (all categories except the one being merged)
  const mergeTargets = sortedCategories.filter(c => c.id !== mergingCategory?.id);

  if (isLoading) {
    return <Card><CardContent className="p-6">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Kategorien verwalten
        </CardTitle>
        <CardDescription>
          Verwalten Sie die Kategorien für Ihre Artikel
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new category */}
        <div className="flex gap-2">
          <Input
            placeholder="Neue Kategorie..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory} disabled={createCategory.isPending || !newCategoryName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Hinzufügen
          </Button>
        </div>

        {/* Missing categories from articles */}
        {missingCategories.length > 0 && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {missingCategories.length} Kategorie(n) aus Artikeln noch nicht in der Datenbank:
              </p>
              <Button size="sm" variant="outline" onClick={handleAddAllMissingCategories}>
                Alle hinzufügen
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {missingCategories.sort((a, b) => a.localeCompare(b, 'de')).map((name) => (
                <Badge
                  key={name}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => handleAddMissingCategory(name)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Categories list */}
        {sortedCategories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Noch keine Kategorien vorhanden.
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

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Kategorie "{deletingCategory?.name}" wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge confirmation dialog */}
      <AlertDialog open={!!mergingCategory} onOpenChange={(open) => !open && setMergingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorien zusammenführen</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Wählen Sie die Zielkategorie, mit der "{mergingCategory?.name}" zusammengeführt werden soll.
                Alle Artikel mit der Kategorie "{mergingCategory?.name}" werden zur Zielkategorie verschoben.
              </p>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Zielkategorie auswählen..." />
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
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMergeConfirm}
              disabled={!mergeTargetId || isMerging}
            >
              {isMerging ? 'Wird zusammengeführt...' : 'Zusammenführen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default Settings;
