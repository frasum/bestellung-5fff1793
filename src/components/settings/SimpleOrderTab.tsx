import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmployeesTab } from './EmployeesTab';

export function SimpleOrderTab() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              EasyOrder
            </CardTitle>
            <CardDescription>
              {t('settings.simpleOrder.description', 'QR-Codes für Mitarbeiter zum einfachen Bestellen erstellen')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <EmployeesTab />
      </CardContent>
    </Card>
  );
}
