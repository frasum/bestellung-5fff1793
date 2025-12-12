import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Bell, BellOff } from 'lucide-react';
import { useNotificationPreferences, useUpsertNotificationPreferences } from '@/hooks/useSettings';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import { Separator } from '@/components/ui/separator';

export const NotificationsTab = () => {
  const { t } = useTranslation();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const upsertPreferences = useUpsertNotificationPreferences();
  const { permission, requestPermission } = useDesktopNotifications();
  const [prefs, setPrefs] = useState({
    email_order_confirmation: true,
    email_order_status: true,
    email_weekly_report: false,
    email_supplier_updates: true,
    email_preorder_received: true,
  });

  useEffect(() => {
    if (preferences) {
      setPrefs({
        email_order_confirmation: preferences.email_order_confirmation,
        email_order_status: preferences.email_order_status,
        email_weekly_report: preferences.email_weekly_report,
        email_supplier_updates: preferences.email_supplier_updates,
        email_preorder_received: preferences.email_preorder_received ?? true,
      });
    }
  }, [preferences]);

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
    <div className="space-y-6">
      {/* Desktop Notifications Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.desktopNotifications')}</CardTitle>
          <CardDescription>{t('settings.desktopNotificationsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label>{t('settings.browserNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.browserNotificationsDesc')}
                </p>
              </div>
            </div>
            {permission === 'granted' ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Check className="w-3 h-3 mr-1" />
                {t('common.active')}
              </Badge>
            ) : permission === 'denied' ? (
              <Badge variant="outline" className="text-destructive border-destructive">
                <BellOff className="w-3 h-3 mr-1" />
                {t('settings.notificationsBlocked')}
              </Badge>
            ) : (
              <Button size="sm" onClick={requestPermission}>
                {t('settings.enableNotifications')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications Card */}
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

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('settings.preorderReceived')}</Label>
                <p className="text-sm text-muted-foreground">{t('settings.preorderReceivedDesc')}</p>
              </div>
              <Switch
                checked={currentPrefs.email_preorder_received}
                onCheckedChange={() => handleToggle('email_preorder_received')}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
