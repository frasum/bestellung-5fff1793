import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Lock, MapPin, Globe, Mail, Palette, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile, useUpdateUserProfile, useUpdatePassword, useOrganization, useUpdateOrganization } from '@/hooks/useSettings';
import { useLocations } from '@/hooks/useLocations';
import { useAllUserDeliveryPreferences, useAllDeliveryAddresses, useUpsertUserDeliveryPreferenceForLocation } from '@/hooks/useUserDeliveryPreference';
import { I18nCheckDialog } from './I18nCheckDialog';
import { UsageDashboard } from './UsageDashboard';

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
    <div className="flex items-center justify-between py-2">
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
  );
};

const AdvancedToolsSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!advancedMode) return null;

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Style Guide Link */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="mb-1 block flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Style Guide
          </Label>
          <p className="text-xs text-muted-foreground">
            Alle UI-Komponenten und Design-Tokens
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/style-guide')}>
          Öffnen
        </Button>
      </div>

      {/* i18n Check */}
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

const TestModeContent = () => {
  const { t } = useTranslation();
  const { data: organization } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const [testEmail, setTestEmail] = useState('');
  const [testEmailError, setTestEmailError] = useState('');

  useEffect(() => {
    if (organization?.test_email) {
      setTestEmail(organization.test_email);
    }
  }, [organization?.test_email]);

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('settings.testModeDescription')}
      </p>
      
      {!organization?.is_demo && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <div className="space-y-0.5">
            <Label htmlFor="test-mode" className="text-sm font-medium">
              {t('settings.testModeEnable')}
            </Label>
            <p className="text-xs text-muted-foreground">
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
            value={testEmail}
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
              size="sm"
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
        <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200 text-sm">{t('settings.testModeActive')}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              {t('settings.testModeActiveDesc', { email: organization.test_email })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export const ProfileTab = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useUserProfile();
  const { data: organization } = useOrganization();
  const updateProfile = useUpdateUserProfile();
  const updatePassword = useUpdatePassword();
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  // Determine default open sections
  const defaultOpenSections: string[] = [];

  return (
    <div className="space-y-4">
      {/* Compact Usage Dashboard */}
      <UsageDashboard variant="compact" />

      {/* Main Accordion Card */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" defaultValue={defaultOpenSections} className="w-full">
            {/* Test Mode Section - only visible in advanced mode - FIRST */}
            {advancedMode && (
              <AccordionItem value="testmode" className="border-b">
                <AccordionTrigger className={`group px-4 py-3 hover:no-underline hover:bg-muted/50 ${organization?.test_mode_enabled ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'data-[state=open]:bg-primary/5'}`}>
                  <div className="flex items-center gap-2">
                    <Mail className={`h-4 w-4 transition-colors ${organization?.test_mode_enabled ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground group-data-[state=open]:text-primary'}`} />
                    <span className={`font-medium transition-colors ${organization?.test_mode_enabled ? '' : 'group-data-[state=open]:text-primary'}`}>{t('testMode.title')}</span>
                    {organization?.test_mode_enabled && (
                      <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">
                        Aktiv
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className={`px-4 pb-4 ${organization?.test_mode_enabled ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-primary/5'}`}>
                  <TestModeContent />
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Profile & Account Section */}
            <AccordionItem value="profile" className="border-b">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.profileInfo')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('common.email')}</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted h-10"
                    />
                    <p className="text-xs text-muted-foreground">{t('settings.emailCannotChange')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full-name">{t('auth.fullName')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="full-name"
                        defaultValue={profile?.full_name || ''}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t('auth.fullName')}
                        className="h-10 flex-1"
                      />
                      <Button 
                        onClick={handleProfileSave} 
                        disabled={updateProfile.isPending} 
                        size="sm"
                        className="h-10"
                      >
                        {updateProfile.isPending ? t('common.saving') : t('common.save')}
                      </Button>
                    </div>
                  </div>

                  <AdvancedSettingsSwitch />
                  <AdvancedToolsSection />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Delivery Addresses Section */}
            <AccordionItem value="addresses" className="border-b">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.defaultDeliveryAddresses')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('settings.defaultDeliveryAddressesDesc')}
                </p>
                <div className="space-y-3">
                  {locations.length > 0 ? (
                    locations.map((location) => {
                      const locationAddresses = getAddressesForLocation(location.id);
                      const currentPreference = getPreferenceForLocation(location.id);
                      
                      return (
                        <div key={location.id} className="space-y-1.5">
                          <Label className="text-sm font-medium">
                            {location.short_code || location.name}
                          </Label>
                          {locationAddresses.length > 0 ? (
                            <Select 
                              value={currentPreference?.delivery_address_id || ''} 
                              onValueChange={(value) => handleAddressChange(location.id, value)}
                            >
                              <SelectTrigger className="w-full h-10">
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
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Password Section */}
            <AccordionItem value="password" className={advancedMode ? "border-b" : ""}>
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.changePassword')}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('settings.passwordDescription')}
                </p>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t('settings.newPasswordPlaceholder')}
                      required
                      className="h-10"
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
                      className="h-10"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}

                  <Button type="submit" disabled={updatePassword.isPending} size="sm">
                    {updatePassword.isPending ? t('settings.updatingPassword') : t('settings.updatePassword')}
                  </Button>
                </form>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};
