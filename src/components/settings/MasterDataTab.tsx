import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ruler, Tag, FolderTree } from 'lucide-react';

interface MasterDataTabProps {
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
  UnitsContent: React.ComponentType;
  CategoriesContent: React.ComponentType;
  ArticleOrganizationContent?: React.ComponentType;
}

export const MasterDataTab = ({ 
  activeSubTab, 
  onSubTabChange, 
  UnitsContent, 
  CategoriesContent,
  ArticleOrganizationContent
}: MasterDataTabProps) => {
  const { t } = useTranslation();
  const [advancedEnabled, setAdvancedEnabled] = useState(false);

  useEffect(() => {
    const checkAdvanced = () => {
      setAdvancedEnabled(localStorage.getItem('advanced-settings-enabled') === 'true');
    };
    checkAdvanced();
    window.addEventListener('storage', checkAdvanced);
    return () => window.removeEventListener('storage', checkAdvanced);
  }, []);

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger 
            value="units" 
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Ruler className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.units')}</span>
            <span className="sm:hidden">{t('settings.unitsShort', 'Einh.')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.categories')}</span>
            <span className="sm:hidden">{t('settings.categoriesShort', 'Kat.')}</span>
          </TabsTrigger>
          {advancedEnabled && ArticleOrganizationContent && (
            <TabsTrigger 
              value="article-organization" 
              className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FolderTree className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{t('settings.articleOrganization.tabTitle')}</span>
              <span className="sm:hidden">{t('settings.articleOrganization.tabTitleShort', 'Org.')}</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent 
          value="units" 
          className="mt-4 animate-in fade-in-50 slide-in-from-left-2 duration-200"
        >
          <UnitsContent />
        </TabsContent>

        <TabsContent 
          value="categories" 
          className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200"
        >
          <CategoriesContent />
        </TabsContent>

        {advancedEnabled && ArticleOrganizationContent && (
          <TabsContent 
            value="article-organization" 
            className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200"
          >
            <ArticleOrganizationContent />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
