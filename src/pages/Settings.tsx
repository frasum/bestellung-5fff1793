import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, User, FlaskConical, MessageSquare } from 'lucide-react';
import { useUserRole } from '@/hooks/useTeam';
import { DemoAccountsTab } from '@/components/settings/DemoAccountsTab';
import { CommunicationTab } from '@/components/settings/CommunicationTab';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { OrganizationTab } from '@/components/settings/OrganizationTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { EmailTemplateTab } from '@/components/settings/EmailTemplateTab';
import { SupplierPortalTab } from '@/components/settings/SupplierPortalTab';

const Settings = () => {
  const { t } = useTranslation();
  const { data: userRole } = useUserRole();
  const isAdmin = userRole === 'admin';

  const [activeTab, setActiveTab] = useState('profile');
  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );
  const [activeSubTabs, setActiveSubTabs] = useState({
    'organization': 'general',
    'communication': 'notifications',
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        const newValue = e.newValue === 'true';
        setAdvancedMode(newValue);
        // Reset to profile tab if demo-accounts tab is hidden
        if (!newValue && activeTab === 'demo-accounts') {
          setActiveTab('profile');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeTab]);

  return (
    <DashboardLayout>
      <div className="space-y-2 md:space-y-5 xl:space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t('settings.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('settings.description')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max sm:w-auto sm:flex-wrap gap-1 bg-muted/50 border border-border rounded-md">
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{t('settings.profile')}</span>
              </TabsTrigger>
              <TabsTrigger value="organization" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{t('settings.organization')}</span>
              </TabsTrigger>
              <TabsTrigger value="communication" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('settings.communication')}</span>
                <span className="sm:hidden">{t('settings.communicationShort')}</span>
              </TabsTrigger>
              {isAdmin && advancedMode && (
                <TabsTrigger value="demo-accounts" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <FlaskConical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('settings.demoAccounts')}</span>
                  <span className="sm:hidden">{t('settings.demoAccountsShort')}</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="profile" className="animate-in fade-in-50 slide-in-from-left-2 duration-200">
            <ProfileTab />
          </TabsContent>

          <TabsContent value="organization" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            <OrganizationTab 
              activeSubTab={activeSubTabs['organization']} 
              onSubTabChange={(value) => setActiveSubTabs(prev => ({ ...prev, organization: value }))}
            />
          </TabsContent>


          <TabsContent value="communication" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
            <CommunicationTab
              activeSubTab={activeSubTabs['communication']}
              onSubTabChange={(value) => setActiveSubTabs(prev => ({ ...prev, communication: value }))}
              NotificationsContent={NotificationsTab}
              EmailTemplatesContent={EmailTemplateTab}
              SupplierPortalContent={SupplierPortalTab}
            />
          </TabsContent>

          {isAdmin && advancedMode && (
            <TabsContent value="demo-accounts" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
              <DemoAccountsTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
