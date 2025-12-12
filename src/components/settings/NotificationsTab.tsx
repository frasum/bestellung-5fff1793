import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useNotificationPreferences, useUpsertNotificationPreferences } from '@/hooks/useSettings';

export const NotificationsTab = () => {
  const { t } = useTranslation();
  const { data: preferences, isLoading } = useNotificationPreferences();
  const upsertPreferences = useUpsertNotificationPreferences();
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
  );
};
