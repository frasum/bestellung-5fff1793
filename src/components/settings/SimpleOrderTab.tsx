import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Users, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmployeesTab } from './EmployeesTab';
import { EasyOrderSortingTab } from './EasyOrderSortingTab';

export function SimpleOrderTab() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('employees');

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Mitarbeiter
            </TabsTrigger>
            <TabsTrigger value="sorting" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Reihenfolge
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees">
            <EmployeesTab />
          </TabsContent>
          
          <TabsContent value="sorting">
            <EasyOrderSortingTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
