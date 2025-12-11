import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Store } from 'lucide-react';
import { useOrganization, useUpdateOrganization } from '@/hooks/useSettings';
import { TeamTab } from './TeamTab';
import { LocationsWithAddressesTab } from './LocationsWithAddressesTab';

interface OrganizationTabProps {
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
}

const OrganizationGeneralContent = () => {
  const { t } = useTranslation();
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (organization && name.trim()) {
      updateOrganization.mutate({ id: organization.id, name: name.trim() });
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
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
  );
};

export const OrganizationTab = ({ activeSubTab, onSubTabChange }: OrganizationTabProps) => {
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
        </TabsList>

        <TabsContent value="general" className="mt-4 animate-in fade-in-50 slide-in-from-left-2 duration-200">
          <OrganizationGeneralContent />
        </TabsContent>

        <TabsContent value="team" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <TeamTab />
        </TabsContent>

        <TabsContent value="locations" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <LocationsWithAddressesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
