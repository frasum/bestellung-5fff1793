import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Building2, Users, Store, Ruler, Tag, FolderTree, Package, FileText, Download, Loader2, Phone, Languages, Crown } from 'lucide-react';
import { useOrganizationDetails, useUpdateOrganization } from '@/hooks/useSettings';
import { TeamTab } from './TeamTab';
import { LocationsWithAddressesTab } from './LocationsWithAddressesTab';
import { UnitsTab } from './UnitsTab';
import { CategoriesTab } from './CategoriesTab';
import { OrderUnitsTab } from './OrderUnitsTab';
import { ArticleOrganizationTab } from './ArticleOrganizationTab';
import { TranslationsTab } from './TranslationsTab';
import { generateSystemOverviewPdf } from '@/lib/systemOverviewPdf';
import { toast } from 'sonner';

interface OrganizationTabProps {
  activeSubTab: string;
  onSubTabChange: (value: string) => void;
}

const OrganizationGeneralContent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: organization, isLoading } = useOrganizationDetails();
  const updateOrganization = useUpdateOrganization();
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const isEnterprise = organization?.subscription_tier === 'enterprise';

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setContactEmail(organization.contact_email || '');
      setContactPhone(organization.contact_phone || '');
      setWebsite(organization.website || '');
      setAddress(organization.address || '');
    }
  }, [organization]);

  const handleSave = () => {
    if (organization) {
      updateOrganization.mutate({ 
        id: organization.id, 
        name: name.trim() || organization.name,
        contact_email: contactEmail.trim() || null,
        contact_phone: contactPhone.trim() || null,
        website: website.trim() || null,
        address: address.trim() || null,
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!organization) return;
    
    setIsGeneratingPdf(true);
    try {
      await generateSystemOverviewPdf({
        companyName: organization.name,
        email: organization.contact_email || undefined,
        phone: organization.contact_phone || undefined,
        website: organization.website || undefined,
        address: organization.address || undefined,
      });
      toast.success(t('settings.pdfDownloaded'));
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t('settings.pdfError'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Organization Header with Subscription Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              <h3 className="font-semibold">{t('settings.orgProfile')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {organization?.subscription_tier || 'free'}
              </Badge>
              {organization?.trial_ends_at && (
                <span className="text-xs text-muted-foreground">
                  {t('settings.trialEnds')}: {new Date(organization.trial_ends_at).toLocaleDateString()}
                </span>
              )}
              {!isEnterprise && (
                <Button 
                  variant="enterprise"
                  size="sm" 
                  onClick={() => navigate('/pricing')}
                  className="gap-1.5 px-4 rounded-full"
                >
                  <Crown className="h-4 w-4" />
                  Enterprise
                </Button>
              )}
            </div>
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="org-name">{t('settings.orgName')}</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.orgNamePlaceholder')}
            />
          </div>

          {/* Contact Fields */}
          <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-email">{t('settings.contactEmail')}</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="info@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-phone">{t('settings.contactPhone')}</Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+49 89 123 456 789"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">{t('settings.website')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            <div className="space-y-2">
              <Label htmlFor="address">{t('settings.address')}</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('settings.addressPlaceholder')}
              />
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={handleSave} disabled={updateOrganization.isPending}>
              {updateOrganization.isPending ? t('settings.savingProfile') : t('settings.saveChanges')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* PDF Export as separate Accordion */}
      <Card>
        <Accordion type="single" collapsible>
          <AccordionItem value="system-pdf" className="border-0">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 group-data-[state=open]:text-primary transition-colors" />
                <span className="group-data-[state=open]:text-primary transition-colors font-medium">
                  {t('settings.systemOverviewPdf')}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-4">{t('settings.systemOverviewPdfDesc')}</p>
                <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {t('settings.downloadPdf')}
                    </>
                  )}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </div>
  );
};

export const OrganizationTab = ({ activeSubTab, onSubTabChange }: OrganizationTabProps) => {
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
    <div className="bg-muted/30 rounded-lg p-2 sm:p-4 border border-border/50">
      <Tabs value={activeSubTab} onValueChange={onSubTabChange} className="space-y-4">
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <TabsList className="bg-muted/50 p-1 w-max min-w-full sm:w-auto">
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
          <TabsTrigger value="units-categories" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Ruler className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('settings.unitsAndCategories')}</span>
            <span className="sm:hidden">{t('settings.unitsAndCategoriesShort')}</span>
          </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4 animate-in fade-in-50 slide-in-from-left-2 duration-200">
          <OrganizationGeneralContent />
        </TabsContent>

        <TabsContent value="team" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <TeamTab />
        </TabsContent>

        <TabsContent value="locations" className="mt-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
          <LocationsWithAddressesTab />
        </TabsContent>

        <TabsContent value="units-categories" className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
          <div className="space-y-6">
            <Tabs defaultValue="units" className="space-y-4">
              <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
              <TabsList className="bg-muted/50 p-1 w-max min-w-full sm:w-auto">
                <TabsTrigger value="units" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Ruler className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('settings.units')}</span>
                  <span className="sm:hidden">{t('settings.unitsShort')}</span>
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('settings.categories')}</span>
                  <span className="sm:hidden">{t('settings.categoriesShort')}</span>
                </TabsTrigger>
                <TabsTrigger value="order-units" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('settings.orderUnits')}</span>
                  <span className="sm:hidden">{t('settings.orderUnitsShort')}</span>
                </TabsTrigger>
                <TabsTrigger value="translations" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{t('settings.translations')}</span>
                  <span className="sm:hidden">{t('settings.translationsShort')}</span>
                </TabsTrigger>
                {advancedEnabled && (
                  <TabsTrigger value="article-organization" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <FolderTree className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">{t('settings.articleOrganization.tabTitle')}</span>
                    <span className="sm:hidden">{t('settings.articleOrganization.tabTitleShort')}</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

              <TabsContent value="units" className="mt-4 animate-in fade-in-50 slide-in-from-left-2 duration-200">
                <UnitsTab />
              </TabsContent>

              <TabsContent value="categories" className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
                <CategoriesTab />
              </TabsContent>

              <TabsContent value="order-units" className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
                <OrderUnitsTab />
              </TabsContent>

              <TabsContent value="translations" className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
                <TranslationsTab />
              </TabsContent>

              {advancedEnabled && (
                <TabsContent value="article-organization" className="mt-4 animate-in fade-in-50 slide-in-from-right-2 duration-200">
                  <ArticleOrganizationTab />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
