import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { IdentificationResult } from './types';

interface ArticleStepProps {
  // Queue info
  queueLength: number;
  currentQueueIndex: number;
  createdArticlesCount: number;
  
  // Preview
  previewImage: string | null;
  identificationResult: IdentificationResult | null;
  
  // Form fields
  articleName: string;
  onArticleNameChange: (value: string) => void;
  articleDescription: string;
  onArticleDescriptionChange: (value: string) => void;
  articleCategory: string;
  onArticleCategoryChange: (value: string) => void;
  articleUnit: string;
  onArticleUnitChange: (value: string) => void;
  articlePrice: string;
  onArticlePriceChange: (value: string) => void;
  articleSku: string;
  onArticleSkuChange: (value: string) => void;
  
  // Options
  categories: string[];
  units: string[];
  
  // Actions
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

export const ArticleStep = memo(function ArticleStep({
  queueLength,
  currentQueueIndex,
  createdArticlesCount,
  previewImage,
  identificationResult,
  articleName,
  onArticleNameChange,
  articleDescription,
  onArticleDescriptionChange,
  articleCategory,
  onArticleCategoryChange,
  articleUnit,
  onArticleUnitChange,
  articlePrice,
  onArticlePriceChange,
  articleSku,
  onArticleSkuChange,
  categories,
  units,
  onBack,
  onNext,
  canProceed,
}: ArticleStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Voice batch progress indicator */}
      {queueLength > 1 && (
        <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg">
          <span className="text-sm font-medium text-primary">
            {t('quickCapture.articleProgress', 'Artikel {{current}} von {{total}}', {
              current: currentQueueIndex + 1,
              total: queueLength
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {createdArticlesCount > 0 && t('quickCapture.articlesCreated', '{{count}} erstellt', { count: createdArticlesCount })}
          </span>
        </div>
      )}

      {/* Image preview mini */}
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
            onChange={(e) => onArticleNameChange(e.target.value)}
            placeholder={t('quickCapture.articleNamePlaceholder', 'z.B. San Marzano Tomaten')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="articleCategory">{t('quickCapture.category', 'Kategorie')}</Label>
            <Input
              id="articleCategory"
              value={articleCategory}
              onChange={(e) => onArticleCategoryChange(e.target.value)}
              placeholder={t('quickCapture.categoryPlaceholder', 'z.B. Getränke')}
              list="categories-list"
              autoComplete="off"
            />
            <datalist id="categories-list">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="articleUnit">{t('quickCapture.unit', 'Einheit')}</Label>
            <Input
              id="articleUnit"
              value={articleUnit}
              onChange={(e) => onArticleUnitChange(e.target.value)}
              placeholder={t('quickCapture.unitPlaceholder', 'z.B. Stk, kg, L')}
              list="units-list"
            />
            <datalist id="units-list">
              {units.map(unit => (
                <option key={unit} value={unit} />
              ))}
            </datalist>
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
              onChange={(e) => onArticlePriceChange(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="articleSku">{t('quickCapture.sku', 'Artikelnummer')}</Label>
            <Input
              id="articleSku"
              value={articleSku}
              onChange={(e) => onArticleSkuChange(e.target.value)}
              placeholder={t('quickCapture.skuPlaceholder', 'Optional')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="articleDescription">{t('quickCapture.description', 'Beschreibung')}</Label>
          <Textarea
            id="articleDescription"
            value={articleDescription}
            onChange={(e) => onArticleDescriptionChange(e.target.value)}
            placeholder={t('quickCapture.descriptionPlaceholder', 'Optionale Beschreibung...')}
            rows={2}
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Zurück')}
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          {t('common.next', 'Weiter')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
});
