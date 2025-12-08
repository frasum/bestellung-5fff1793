import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Mail, RotateCcw, Check } from 'lucide-react';
import { useEmailTemplate, useUpsertEmailTemplate, getDefaultTemplate } from '@/hooks/useEmailTemplates';

export const EmailTemplateTab = () => {
  const { t } = useTranslation();
  const { data: template, isLoading } = useEmailTemplate();
  const upsertTemplate = useUpsertEmailTemplate();
  const defaultTemplate = getDefaultTemplate();

  const [formData, setFormData] = useState({
    subject_template: '',
    greeting: '',
    introduction: '',
    closing: '',
    signature: '',
    article_list_format: '',
    design_style: 'modern' as 'modern' | 'classic' | 'minimalist',
    footer_text: '',
    footer_logo_url: '',
    show_powered_by: true,
  });

  useState(() => {
    if (template) {
      setFormData({
        subject_template: template.subject_template,
        greeting: template.greeting,
        introduction: template.introduction,
        closing: template.closing,
        signature: template.signature,
        article_list_format: template.article_list_format,
        design_style: template.design_style || 'modern',
        footer_text: template.footer_text || '',
        footer_logo_url: template.footer_logo_url || '',
        show_powered_by: template.show_powered_by ?? true,
      });
    } else {
      setFormData({
        subject_template: defaultTemplate.subject_template || '',
        greeting: defaultTemplate.greeting || '',
        introduction: defaultTemplate.introduction || '',
        closing: defaultTemplate.closing || '',
        signature: defaultTemplate.signature || '',
        article_list_format: defaultTemplate.article_list_format || '',
        design_style: defaultTemplate.design_style || 'modern',
        footer_text: defaultTemplate.footer_text || '',
        footer_logo_url: defaultTemplate.footer_logo_url || '',
        show_powered_by: defaultTemplate.show_powered_by ?? true,
      });
    }
  });

  const currentData = template ? {
    subject_template: template.subject_template,
    greeting: template.greeting,
    introduction: template.introduction,
    closing: template.closing,
    signature: template.signature,
    article_list_format: template.article_list_format,
    design_style: template.design_style || 'modern',
    footer_text: template.footer_text || '',
    footer_logo_url: template.footer_logo_url || '',
    show_powered_by: template.show_powered_by ?? true,
  } : formData;

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDesignChange = (design: 'modern' | 'classic' | 'minimalist') => {
    setFormData(prev => ({ ...prev, design_style: design }));
  };

  const handleSave = () => {
    upsertTemplate.mutate(formData);
  };

  const handleReset = () => {
    setFormData({
      subject_template: defaultTemplate.subject_template || '',
      greeting: defaultTemplate.greeting || '',
      introduction: defaultTemplate.introduction || '',
      closing: defaultTemplate.closing || '',
      signature: defaultTemplate.signature || '',
      article_list_format: defaultTemplate.article_list_format || '',
      design_style: defaultTemplate.design_style || 'modern',
      footer_text: defaultTemplate.footer_text || '',
      footer_logo_url: defaultTemplate.footer_logo_url || '',
      show_powered_by: defaultTemplate.show_powered_by ?? true,
    });
  };

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  const designOptions = [
    {
      id: 'modern' as const,
      name: t('settings.emailDesignModern'),
      description: t('settings.emailDesignModernDesc'),
      preview: 'bg-gradient-to-r from-[#1e3a5f] to-[#2563eb]',
    },
    {
      id: 'classic' as const,
      name: t('settings.emailDesignClassic'),
      description: t('settings.emailDesignClassicDesc'),
      preview: 'bg-[#1e3a5f]',
    },
    {
      id: 'minimalist' as const,
      name: t('settings.emailDesignMinimalist'),
      description: t('settings.emailDesignMinimalistDesc'),
      preview: 'bg-muted border',
    },
  ];

  const selectedDesign = formData.design_style || currentData.design_style || 'modern';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.emailFooter')}
          </CardTitle>
          <CardDescription>{t('settings.emailFooterDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-powered-by">{t('settings.showPoweredBy')}</Label>
              <p className="text-xs text-muted-foreground">{t('settings.showPoweredByDesc')}</p>
            </div>
            <Switch
              id="show-powered-by"
              checked={formData.show_powered_by ?? currentData.show_powered_by ?? true}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_powered_by: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-text">{t('settings.customFooterText')}</Label>
            <Input
              id="footer-text"
              value={formData.footer_text || currentData.footer_text || ''}
              onChange={(e) => handleChange('footer_text', e.target.value)}
              placeholder={t('settings.customFooterTextPlaceholder')}
            />
            <p className="text-xs text-muted-foreground">{t('settings.customFooterTextHint')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="footer-logo-url">{t('settings.footerLogoUrl')}</Label>
            <Input
              id="footer-logo-url"
              value={formData.footer_logo_url || currentData.footer_logo_url || ''}
              onChange={(e) => handleChange('footer_logo_url', e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">{t('settings.footerLogoUrlHint')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t('settings.emailDesign')}
          </CardTitle>
          <CardDescription>{t('settings.emailDesignDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {designOptions.map((design) => (
              <div
                key={design.id}
                onClick={() => handleDesignChange(design.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedDesign === design.id
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-muted hover:border-primary/50'
                }`}
              >
                <div className={`h-20 rounded-md mb-3 ${design.preview}`} />
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{design.name}</h4>
                  {selectedDesign === design.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{design.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('settings.emailTemplateTitle')}
          </CardTitle>
          <CardDescription>{t('settings.emailTemplateDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="subject-template">{t('settings.subjectTemplate')}</Label>
            <Input
              id="subject-template"
              value={formData.subject_template || currentData.subject_template}
              onChange={(e) => handleChange('subject_template', e.target.value)}
              placeholder="Neue Bestellung von {restaurant_name}"
            />
            <p className="text-xs text-muted-foreground">{t('settings.subjectTemplateHelp')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="greeting">{t('settings.greeting')}</Label>
            <Input
              id="greeting"
              value={formData.greeting || currentData.greeting}
              onChange={(e) => handleChange('greeting', e.target.value)}
              placeholder="Guten Tag,"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="introduction">{t('settings.introduction')}</Label>
            <Textarea
              id="introduction"
              value={formData.introduction || currentData.introduction}
              onChange={(e) => handleChange('introduction', e.target.value)}
              placeholder="hiermit senden wir Ihnen unsere Bestellung:"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="closing">{t('settings.closing')}</Label>
            <Textarea
              id="closing"
              value={formData.closing || currentData.closing}
              onChange={(e) => handleChange('closing', e.target.value)}
              placeholder="Vielen Dank für Ihre Zusammenarbeit."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">{t('settings.signature')}</Label>
            <Textarea
              id="signature"
              value={formData.signature || currentData.signature}
              onChange={(e) => handleChange('signature', e.target.value)}
              placeholder="Mit freundlichen Grüßen,&#10;{restaurant_name}"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{t('settings.signatureHelp')}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-list-format">{t('settings.articleListFormat')}</Label>
            <Textarea
              id="article-list-format"
              value={formData.article_list_format || currentData.article_list_format}
              onChange={(e) => handleChange('article_list_format', e.target.value)}
              placeholder="- {article_name}{sku_suffix}: {quantity} {unit} à €{unit_price} = €{total_price}"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">{t('settings.articleListFormatHelp')}</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={upsertTemplate.isPending}>
              {upsertTemplate.isPending ? t('common.saving') : t('common.save')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('settings.resetToDefault')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
