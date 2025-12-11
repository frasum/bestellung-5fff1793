import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, MapPin, Globe } from 'lucide-react';
import { useUserProfile, useUpdateUserProfile, useUpdatePassword } from '@/hooks/useSettings';
import { useLocations } from '@/hooks/useLocations';
import { useAllUserDeliveryPreferences, useAllDeliveryAddresses, useUpsertUserDeliveryPreferenceForLocation } from '@/hooks/useUserDeliveryPreference';
import { I18nCheckDialog } from './I18nCheckDialog';

const AdvancedSettingsSwitch = () => {
  const { t } = useTranslation();
  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  const handleToggle = (checked: boolean) => {
    setAdvancedMode(checked);
    localStorage.setItem('advanced-settings-enabled', checked.toString());
    window.dispatchEvent(new StorageEvent('storage', { key: 'advanced-settings-enabled', newValue: checked.toString() }));
  };
  
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

const I18nCheckButton = () => {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="pt-4 border-t">
      <div className="flex items-center justify-between">
        <div>
          <Label className="mb-1 block flex items-center gap-2">
            <Globe className="h-4 w-4" />
            i18n Check
          </Label>
          <p className="text-xs text-muted-foreground">
            Überprüft Übersetzungen auf Vollständigkeit
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          Prüfen
        </Button>
      </div>
      <I18nCheckDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export const ProfileTab = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const updatePassword = useUpdatePassword();
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // All locations and delivery addresses
  const { data: locations = [] } = useLocations();
  const { data: allAddresses = [] } = useAllDeliveryAddresses();
  const { data: allPreferences = [] } = useAllUserDeliveryPreferences();
  const upsertPreference = useUpsertUserDeliveryPreferenceForLocation();

  // Get addresses for a specific location
  const getAddressesForLocation = (locationId: string) => {
    return allAddresses.filter(addr => addr.location_id === locationId);
  };

  // Get current preference for a location
  const getPreferenceForLocation = (locationId: string) => {
    return allPreferences.find(pref => pref.location_id === locationId);
  };

  const handleAddressChange = (locationId: string, addressId: string) => {
    upsertPreference.mutate({ locationId, deliveryAddressId: addressId });
  };

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
          <I18nCheckButton />
        </CardContent>
      </Card>

      {/* Default Delivery Addresses Card - All Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('settings.defaultDeliveryAddresses')}
          </CardTitle>
          <CardDescription>
            {t('settings.defaultDeliveryAddressesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {locations.length > 0 ? (
            locations.map((location) => {
              const locationAddresses = getAddressesForLocation(location.id);
              const currentPreference = getPreferenceForLocation(location.id);
              
              return (
                <div key={location.id} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {location.short_code || location.name}
                  </Label>
                  {locationAddresses.length > 0 ? (
                    <Select 
                      value={currentPreference?.delivery_address_id || ''} 
                      onValueChange={(value) => handleAddressChange(location.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('settings.selectDefaultAddress')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locationAddresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.label} - {address.address_line1}, {address.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('settings.noAddressesForLocation')}</p>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{t('settings.noLocations')}</p>
          )}
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
