import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout, useSidebarContext } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, MessageSquare, Store, ClipboardCheck, Gift, TrendingDown, Shield, Settings2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useTeam';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { CommunicationTab } from '@/components/settings/CommunicationTab';

import { OrganizationTab } from '@/components/settings/OrganizationTab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { EmailTemplateTab } from '@/components/settings/EmailTemplateTab';
import { SupplierPortalTab } from '@/components/settings/SupplierPortalTab';
import { B2BPortalOverviewTab } from '@/components/settings/B2BPortalOverviewTab';
import { SystemFeaturePrioritiesTab } from '@/components/settings/SystemFeaturePrioritiesTab';
import { FriendsAndFamilyTab } from '@/components/settings/FriendsAndFamilyTab';
import { PriceWatchSettingsTab } from '@/components/settings/PriceWatchSettingsTab';
import { OrganizationsOverviewTab } from '@/components/settings/OrganizationsOverviewTab';
import { SystemTab } from '@/components/settings/SystemTab';

// Default sub-tabs for each main tab (won't be shown in URL)
const DEFAULT_SUB_TABS: Record<string, string> = {
  organization: 'general',
  communication: 'notifications',
};

// Sub-tabs configuration for each main tab
const SUB_TABS_CONFIG: Record<string, string[]> = {
  organization: ['general', 'team', 'locations', 'units-categories'],
  communication: ['notifications', 'email-templates', 'supplier-portal'],
};

const Settings = () => {
  const { t } = useTranslation();
  const { data: userRole } = useUserRole();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const isAdmin = userRole === 'admin';
  const [searchParams, setSearchParams] = useSearchParams();

  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  // Build list of allowed tabs based on user role and advanced mode
  const allowedTabs = useMemo(() => {
    const tabs = ['organization', 'communication', 'system'];
    if (isSuperAdmin) tabs.push('b2b-portal', 'friends-family', 'organizations');
    if (isAdmin) tabs.push('price-watch');
    if (isAdmin && advancedMode) tabs.push('developer-checklist');
    return tabs;
  }, [isAdmin, isSuperAdmin, advancedMode]);

  // Read tab/subtab from URL with validation
  const rawTab = searchParams.get('tab');
  const rawSubTab = searchParams.get('subtab');

  // Validate and normalize tab
  const activeTab = useMemo(() => {
    if (!rawTab) return 'organization';
    if (allowedTabs.includes(rawTab)) return rawTab;
    return 'organization';
  }, [rawTab, allowedTabs]);

  // Validate and normalize subtab
  const activeSubTab = useMemo(() => {
    const subTabs = SUB_TABS_CONFIG[activeTab];
    if (!subTabs) return null;
    if (!rawSubTab) return DEFAULT_SUB_TABS[activeTab] || subTabs[0];
    if (subTabs.includes(rawSubTab)) return rawSubTab;
    return DEFAULT_SUB_TABS[activeTab] || subTabs[0];
  }, [activeTab, rawSubTab]);

  // Clean up URL if tab/subtab was invalid
  useEffect(() => {
    const needsCleanup = 
      (rawTab && rawTab !== activeTab) || 
      (rawSubTab && rawSubTab !== activeSubTab);
    
    if (needsCleanup) {
      const newParams: Record<string, string> = {};
      if (activeTab !== 'organization') {
        newParams.tab = activeTab;
      }
      if (activeSubTab && activeSubTab !== DEFAULT_SUB_TABS[activeTab]) {
        newParams.subtab = activeSubTab;
      }
      setSearchParams(newParams, { replace: true });
    }
  }, [rawTab, rawSubTab, activeTab, activeSubTab, setSearchParams]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        const newValue = e.newValue === 'true';
        setAdvancedMode(newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle tab change - updates URL
  const handleTabChange = (tab: string) => {
    if (tab === 'organization') {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  // Handle sub-tab change - updates URL
  const handleSubTabChange = (subtab: string) => {
    const defaultSubTab = DEFAULT_SUB_TABS[activeTab];
    if (subtab === defaultSubTab) {
      // Default sub-tab: don't show in URL
      if (activeTab === 'organization') {
        setSearchParams({});
      } else {
        setSearchParams({ tab: activeTab });
      }
    } else {
      setSearchParams({ tab: activeTab, subtab });
    }
  };

  const { sidebarCollapsed, toggleSidebar } = useSidebarContext();
  
  return (
    <DashboardLayout>
      <div className="space-y-2 md:space-y-5 xl:space-y-6">
        <PageHeader 
          activeTab={activeTab}
          activeSubTab={activeSubTab}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-max sm:w-auto sm:flex-wrap gap-1 bg-muted/50 border border-border rounded-md">
                <TabsTrigger value="organization" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('settings.organization')}</span>
                </TabsTrigger>
                <TabsTrigger value="communication" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('settings.communication')}</span>
                  <span className="sm:hidden">{t('settings.communicationShort')}</span>
                </TabsTrigger>
                <TabsTrigger value="system" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                  <Settings2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{t('settings.system')}</span>
                </TabsTrigger>
                {isSuperAdmin && (
                  <TabsTrigger value="b2b-portal" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>B2B Portal</span>
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="friends-family" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Friends & Family</span>
                    <span className="sm:hidden">F&F</span>
                  </TabsTrigger>
                )}
                {isSuperAdmin && (
                  <TabsTrigger value="organizations" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Organisationen</span>
                    <span className="sm:hidden">Orgs</span>
                  </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="price-watch" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Preisüberwachung</span>
                    <span className="sm:hidden">Preise</span>
                  </TabsTrigger>
                )}
                {isAdmin && advancedMode && (
                  <TabsTrigger value="developer-checklist" className="gap-1.5 text-xs sm:text-sm whitespace-nowrap">
                    <ClipboardCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('settings.developerChecklist')}</span>
                    <span className="sm:hidden">{t('settings.developerChecklistShort')}</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
          </div>

          <TabsContent value="organization" className="animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
            <OrganizationTab 
              activeSubTab={activeSubTab || 'general'} 
              onSubTabChange={handleSubTabChange}
            />
          </TabsContent>


          <TabsContent value="communication" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
            <CommunicationTab
              activeSubTab={activeSubTab || 'notifications'}
              onSubTabChange={handleSubTabChange}
              NotificationsContent={NotificationsTab}
              EmailTemplatesContent={EmailTemplateTab}
              SupplierPortalContent={SupplierPortalTab}
            />
          </TabsContent>

          <TabsContent value="system" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
            <SystemTab />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="b2b-portal" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
              <B2BPortalOverviewTab />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="friends-family" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
              <FriendsAndFamilyTab />
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="organizations" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
              <OrganizationsOverviewTab />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="price-watch" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
              <PriceWatchSettingsTab />
            </TabsContent>
          )}

          {isAdmin && advancedMode && (
            <TabsContent value="developer-checklist" className="animate-in fade-in-50 slide-in-from-right-2 duration-200">
              <SystemFeaturePrioritiesTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;