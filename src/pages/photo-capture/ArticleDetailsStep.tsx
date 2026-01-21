import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { IdentificationResult } from './types';

interface ArticleDetailsStepProps {
  previewImage: string | null;
  identificationResult: IdentificationResult | null;
  articleName: string;
  setArticleName: (name: string) => void;
  articleDescription: string;
  setArticleDescription: (desc: string) => void;
  articleCategory: string;
  setArticleCategory: (cat: string) => void;
  articleUnit: string;
  setArticleUnit: (unit: string) => void;
  articlePrice: string;
  setArticlePrice: (price: string) => void;
  articleSku: string;
  setArticleSku: (sku: string) => void;
  categories: string[];
  units: string[];
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
}

export const ArticleDetailsStep = ({
  previewImage,
  identificationResult,
  articleName,
  setArticleName,
  articleDescription,
  setArticleDescription,
  articleCategory,
  setArticleCategory,
  articleUnit,
  setArticleUnit,
  articlePrice,
  setArticlePrice,
  articleSku,
  setArticleSku,
  categories,
  units,
  canProceed,
  onBack,
  onNext,
}: ArticleDetailsStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {previewImage && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <img src={previewImage} alt="Preview" className="w-16 h-16 object-cover rounded" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{t('quickCapture.aiSuggestion', 'KI-Vorschlag')}</span>
            </div>
            {identificationResult && (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                identificationResult.confidence === 'high' ? 'bg-green-500/20 text-green-600' :
                identificationResult.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                'bg-red-500/20 text-red-600'
              )}>
                {identificationResult.confidence === 'high' ? t('quickCapture.highConfidence', 'Hohe Sicherheit') :
                 identificationResult.confidence === 'medium' ? t('quickCapture.mediumConfidence', 'Mittlere Sicherheit') :
                 t('quickCapture.lowConfidence', 'Niedrige Sicherheit')}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="articleName">{t('quickCapture.articleName', 'Artikelname')} *</Label>
          <Input
            id="articleName"
            value={articleName}
            onChange={(e) => setArticleName(e.target.value)}
            placeholder={t('quickCapture.articleNamePlaceholder', 'z.B. San Marzano Tomaten')}
            className="h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t('quickCapture.category', 'Kategorie')}</Label>
            <Select value={articleCategory} onValueChange={setArticleCategory}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t('quickCapture.selectCategory', 'Wählen...')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('quickCapture.unit', 'Einheit')}</Label>
            <Select value={articleUnit} onValueChange={setArticleUnit}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={t('quickCapture.selectUnit', 'Wählen...')} />
              </SelectTrigger>
              <SelectContent>
                {units.map(unit => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="articlePrice">{t('quickCapture.price', 'Preis (€)')} *</Label>
            <Input
              id="articlePrice"
              type="text"
              inputMode="decimal"
              value={articlePrice}
              onChange={(e) => setArticlePrice(e.target.value)}
              placeholder="0,00"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="articleSku">{t('quickCapture.sku', 'Artikelnummer')}</Label>
            <Input
              id="articleSku"
              value={articleSku}
              onChange={(e) => setArticleSku(e.target.value)}
              placeholder={t('quickCapture.skuPlaceholder', 'Optional')}
              className="h-12"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="articleDescription">{t('quickCapture.description', 'Beschreibung')}</Label>
          <Textarea
            id="articleDescription"
            value={articleDescription}
            onChange={(e) => setArticleDescription(e.target.value)}
            placeholder={t('quickCapture.descriptionPlaceholder', 'Optionale Beschreibung...')}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Zurück')}
        </Button>
        <Button size="lg" onClick={onNext} disabled={!canProceed}>
          {t('common.next', 'Weiter')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
