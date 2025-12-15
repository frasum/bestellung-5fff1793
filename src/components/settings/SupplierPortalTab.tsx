import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExternalLink, FileText, ImageIcon, Upload, Trash2, Loader2, RotateCcw, Columns } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupplierPortalSettings, useUpsertSupplierPortalSettings, DEFAULT_PORTAL_SETTINGS, PortalColumnKey, DEFAULT_VISIBLE_COLUMNS } from '@/hooks/useSupplierPortalSettings';
import { PortalPreview } from '@/components/suppliers/PortalPreview';
import { PortalColumnsConfig } from './PortalColumnsConfig';

export const SupplierPortalTab = () => {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSupplierPortalSettings();
  const upsertSettings = useUpsertSupplierPortalSettings();
  
  const [portalTitle, setPortalTitle] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [infoText, setInfoText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<PortalColumnKey[]>(DEFAULT_VISIBLE_COLUMNS);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setPortalTitle(settings.portal_title);
    setWelcomeMessage(settings.welcome_message || '');
    setCardTitle(settings.card_title);
    setCardDescription(settings.card_description);
    setInfoText(settings.info_text || '');
    setFooterText(settings.footer_text || '');
    setLogoUrl(settings.logo_url || null);
    setVisibleColumns(settings.visible_columns || DEFAULT_VISIBLE_COLUMNS);
    setInitialized(true);
  } else if (!settings && !isLoading && !initialized) {
    setPortalTitle(DEFAULT_PORTAL_SETTINGS.portal_title);
    setWelcomeMessage('');
    setCardTitle(DEFAULT_PORTAL_SETTINGS.card_title);
    setCardDescription(DEFAULT_PORTAL_SETTINGS.card_description);
    setInfoText('');
    setFooterText('');
    setLogoUrl(null);
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    setInitialized(true);
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t('settings.selectImageFile'));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.fileTooLarge'));
      return;
    }

    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.organization_id}/logo-${Date.now()}.${fileExt}`;

      if (logoUrl) {
        const oldPath = logoUrl.split('/portal-logos/')[1];
        if (oldPath) {
          await supabase.storage.from('portal-logos').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('portal-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('portal-logos')
        .getPublicUrl(fileName);

      await upsertSettings.mutateAsync({ logo_url: publicUrl });
      setLogoUrl(publicUrl);
      toast.success(t('settings.logoUploaded'));
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error(t('settings.logoUploadError') + ': ' + error.message);
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      const path = logoUrl.split('/portal-logos/')[1];
      if (path) {
        await supabase.storage.from('portal-logos').remove([path]);
      }

      await upsertSettings.mutateAsync({ logo_url: null });
      setLogoUrl(null);
      toast.success(t('settings.logoRemoved'));
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error(t('settings.logoRemoveError') + ': ' + error.message);
    }
  };

  const handleSave = () => {
    upsertSettings.mutate({
      portal_title: portalTitle,
      welcome_message: welcomeMessage || null,
      card_title: cardTitle,
      card_description: cardDescription,
      info_text: infoText || null,
      footer_text: footerText || null,
      visible_columns: visibleColumns,
    });
  };

  const handleReset = () => {
    setPortalTitle(DEFAULT_PORTAL_SETTINGS.portal_title);
    setWelcomeMessage('');
    setCardTitle(DEFAULT_PORTAL_SETTINGS.card_title);
    setCardDescription(DEFAULT_PORTAL_SETTINGS.card_description);
    setInfoText('');
    setFooterText('');
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Accordion type="multiple" className="w-full">
          {/* 1. Portal Preview */}
          <AccordionItem value="preview" className="border-b">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.portalPreview')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-4">{t('settings.portalPreviewDesc')}</p>
              <PortalPreview
                logoUrl={logoUrl}
                portalTitle={portalTitle}
                welcomeMessage={welcomeMessage}
                cardTitle={cardTitle}
                cardDescription={cardDescription}
                infoText={infoText}
                footerText={footerText}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 2. Branding */}
          <AccordionItem value="branding" className="border-b">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.branding')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-4">{t('settings.brandingDesc')}</p>
              
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  {t('settings.portalLogo')}
                </Label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Portal Logo" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label htmlFor="logo-upload">
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLogo}
                          onClick={() => document.getElementById('logo-upload')?.click()}
                        >
                          {uploadingLogo ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          {logoUrl ? t('settings.changeLogo') : t('settings.uploadLogo')}
                        </Button>
                      </label>
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          {t('settings.removeLogo')}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.portalLogoMaxSize')}
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Texts & Messages */}
          <AccordionItem value="texts" className="border-b">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.portalTexts')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-4">{t('settings.portalTextsDesc')}</p>
              
              <div className="space-y-6">
                {/* Markdown Hint */}
                <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">{t('settings.markdownSupport')}</p>
                  <p>{t('settings.markdownExample')}</p>
                </div>

                {/* Portal Title */}
                <div className="space-y-2">
                  <Label htmlFor="portal-title">{t('settings.portalTitle')}</Label>
                  <Input
                    id="portal-title"
                    value={portalTitle}
                    onChange={(e) => setPortalTitle(e.target.value)}
                    placeholder={t('settings.portalTitlePlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground">{t('settings.portalTitleDesc')}</p>
                </div>

                {/* Welcome Message */}
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">{t('settings.welcomeMessage')}</Label>
                  <Textarea
                    id="welcome-message"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder={t('settings.welcomeMessagePlaceholder')}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">{t('settings.welcomeMessageDesc')}</p>
                  {welcomeMessage && (
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-2">{t('settings.templatePreview')}:</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => (
                              <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {welcomeMessage}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {/* Article Section */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-4">{t('settings.articleSection')}</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-title">{t('settings.sectionTitle')}</Label>
                      <Input
                        id="card-title"
                        value={cardTitle}
                        onChange={(e) => setCardTitle(e.target.value)}
                        placeholder={t('settings.sectionTitlePlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="card-description">{t('settings.sectionDescription')}</Label>
                      <Input
                        id="card-description"
                        value={cardDescription}
                        onChange={(e) => setCardDescription(e.target.value)}
                        placeholder={t('settings.sectionDescriptionPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Texts */}
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-4">{t('settings.additionalTexts')}</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="info-text">{t('settings.infoText')}</Label>
                      <Textarea
                        id="info-text"
                        value={infoText}
                        onChange={(e) => setInfoText(e.target.value)}
                        placeholder={t('settings.infoTextPlaceholder')}
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground">{t('settings.infoTextDesc')}</p>
                      {infoText && (
                        <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground mb-2">{t('settings.templatePreview')}:</p>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                a: ({ href, children }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {infoText}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="footer-text">{t('settings.footerTextLabel')}</Label>
                      <Textarea
                        id="footer-text"
                        value={footerText}
                        onChange={(e) => setFooterText(e.target.value)}
                        placeholder={t('settings.footerTextPlaceholder')}
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">{t('settings.footerTextDesc')}</p>
                      {footerText && (
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg text-center">
                          <p className="text-xs font-medium text-muted-foreground mb-2">{t('settings.templatePreview')}:</p>
                          <div className="prose prose-sm dark:prose-invert max-w-none mx-auto">
                            <ReactMarkdown
                              components={{
                                a: ({ href, children }) => (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {footerText}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Column Configuration */}
          <AccordionItem value="columns">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <Columns className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.columnConfiguration')}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-4">{t('settings.columnConfigurationDesc')}</p>
              <PortalColumnsConfig
                visibleColumns={visibleColumns}
                onChange={setVisibleColumns}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Save/Reset Buttons - outside accordions */}
        <div className="flex justify-end gap-2 p-4 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={upsertSettings.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('common.reset')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={upsertSettings.isPending}
          >
            {upsertSettings.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            {t('common.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
