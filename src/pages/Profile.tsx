import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Globe, Mail, Palette, User, Map, Database, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserProfile, useUpdateUserProfile, useUpdatePassword, useOrganization, useUpdateOrganization } from '@/hooks/useSettings';
import { I18nCheckDialog } from '@/components/settings/I18nCheckDialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';

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
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-muted/30">
      <div>
        <Label className="mb-1 block font-medium">{t('settings.advancedSettings')}</Label>
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Entwickler-Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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

        {/* System Architecture */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="mb-1 block flex items-center gap-2">
              <Map className="h-4 w-4" />
              Systemarchitektur
            </Label>
            <p className="text-xs text-muted-foreground">
              Grafische Übersicht aller Module und Portale
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/system-architecture')}>
            Öffnen
          </Button>
        </div>

        {/* Database Architecture */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="mb-1 block flex items-center gap-2">
              <Database className="h-4 w-4" />
              Datenbankarchitektur
            </Label>
            <p className="text-xs text-muted-foreground">
              Entity-Relationship-Diagramm aller Tabellen
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/database-architecture')}>
            Öffnen
          </Button>
        </div>

        {/* Infrastructure */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="mb-1 block flex items-center gap-2">
              <Server className="h-4 w-4" />
              Infrastruktur
            </Label>
            <p className="text-xs text-muted-foreground">
              Technische Architektur und externe Dienste
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/infrastructure')}>
            Öffnen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TestModeSection = () => {
  const { t } = useTranslation();
  const { data: organization } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const [testEmails, setTestEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
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

  useEffect(() => {
    if (organization?.test_emails && organization.test_emails.length > 0) {
      setTestEmails(organization.test_emails);
    } else if (organization?.test_email) {
      setTestEmails([organization.test_email]);
    }
  }, [organization?.test_emails, organization?.test_email]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleTestModeToggle = (enabled: boolean) => {
    if (!organization) return;
    
    if (enabled && testEmails.length === 0) {
      setEmailError(t('settings.testEmailError'));
      return;
    }

    updateOrganization.mutate({
      id: organization.id,
      test_mode_enabled: enabled,
      test_emails: testEmails,
      test_email: testEmails[0] || organization.test_email,
    });
  };

  const handleAddEmail = () => {
    if (!newEmail) {
      setEmailError(t('settings.testEmailRequired'));
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError(t('settings.testEmailInvalid'));
      return;
    }

    if (testEmails.includes(newEmail)) {
      setEmailError(t('settings.testEmailDuplicate'));
      return;
    }

    if (testEmails.length >= 5) {
      setEmailError(t('settings.maxTestEmails'));
      return;
    }

    const updatedEmails = [...testEmails, newEmail];
    setTestEmails(updatedEmails);
    setNewEmail('');
    setEmailError('');

    if (organization) {
      updateOrganization.mutate({
        id: organization.id,
        test_emails: updatedEmails,
        test_email: updatedEmails[0],
      });
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    const updatedEmails = testEmails.filter(e => e !== emailToRemove);
    setTestEmails(updatedEmails);

    if (organization) {
      updateOrganization.mutate({
        id: organization.id,
        test_emails: updatedEmails,
        test_email: updatedEmails[0] || null,
      });
    }
  };

  if (!advancedMode || organization?.is_demo) return null;

  return (
    <Card className={organization?.test_mode_enabled ? 'border-amber-300 dark:border-amber-700' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className={`h-4 w-4 ${organization?.test_mode_enabled ? 'text-amber-600' : ''}`} />
            {t('testMode.title')}
            {organization?.test_mode_enabled && (
              <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">
                Aktiv
              </span>
            )}
          </CardTitle>
          <Switch
            checked={organization?.test_mode_enabled || false}
            onCheckedChange={handleTestModeToggle}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {organization?.test_mode_enabled 
            ? t('settings.testModeActiveDesc', { count: testEmails.length })
            : t('settings.testModeEnabledDesc')
          }
        </p>

        <div className="space-y-3">
          <Label>{t('settings.testEmailAddresses')}</Label>
          
          {/* List of existing emails */}
          {testEmails.length > 0 && (
            <div className="space-y-2">
              {testEmails.map((email, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={email}
                    disabled
                    className="flex-1 bg-muted h-9"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    className="h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new email */}
          {testEmails.length < 5 && (
            <div className="flex gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder={t('settings.testEmailPlaceholder')}
                className="flex-1 h-9"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
              />
              <Button 
                onClick={handleAddEmail} 
                disabled={updateOrganization.isPending || !newEmail}
                variant="outline"
                size="sm"
                className="h-9"
              >
                {t('settings.addTestEmail')}
              </Button>
            </div>
          )}

          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
          
          <p className="text-xs text-muted-foreground">
            {t('settings.testEmailsDesc')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const Profile = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();
  const updatePassword = useUpdatePassword();
  const [fullName, setFullName] = useState('');
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
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <PageHeader />

        <div className="grid gap-4 md:gap-6 max-w-2xl">
          {/* Profile Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('settings.profileInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {t('settings.changePassword')}
              </CardTitle>
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
                    placeholder="••••••••"
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
                    placeholder="••••••••"
                    className="h-10"
                  />
                </div>

                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}

                <Button
                  type="submit"
                  disabled={updatePassword.isPending || !newPassword || !confirmPassword}
                >
                  {updatePassword.isPending ? t('common.saving') : t('settings.changePassword')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Advanced Settings Toggle */}
          <AdvancedSettingsSwitch />

          {/* Test Mode Section - only shown in advanced mode */}
          <TestModeSection />

          {/* Advanced Tools - only shown in advanced mode */}
          <AdvancedToolsSection />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
