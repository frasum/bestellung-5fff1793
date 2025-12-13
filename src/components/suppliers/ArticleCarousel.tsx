import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Sparkles, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface BatchArticleData {
  imageId: string;
  imageBase64: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  price: string;
  sku: string;
  confidence: 'high' | 'medium' | 'low';
  skipped: boolean;
}

interface ArticleCarouselProps {
  articles: BatchArticleData[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onArticleChange: (index: number, data: Partial<BatchArticleData>) => void;
  onSkipArticle: (index: number) => void;
  categories: string[];
  units: string[];
}

export const ArticleCarousel = ({
  articles,
  currentIndex,
  onIndexChange,
  onArticleChange,
  onSkipArticle,
  categories,
  units,
}: ArticleCarouselProps) => {
  const { t } = useTranslation();
  
  const currentArticle = articles[currentIndex];
  if (!currentArticle) return null;

  const activeArticles = articles.filter(a => !a.skipped);
  const activeCount = activeArticles.length;

  const goToPrev = () => {
    let newIndex = currentIndex - 1;
    while (newIndex >= 0 && articles[newIndex].skipped) {
      newIndex--;
    }
    if (newIndex >= 0) onIndexChange(newIndex);
  };

  const goToNext = () => {
    let newIndex = currentIndex + 1;
    while (newIndex < articles.length && articles[newIndex].skipped) {
      newIndex++;
    }
    if (newIndex < articles.length) onIndexChange(newIndex);
  };

  const handleChange = (field: keyof BatchArticleData, value: string) => {
    onArticleChange(currentIndex, { [field]: value });
  };

  const handleSkip = () => {
    onSkipArticle(currentIndex);
    goToNext();
  };

  // Find position among non-skipped articles
  const currentPosition = activeArticles.findIndex(a => a.imageId === currentArticle.imageId) + 1;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPrev}
          disabled={currentIndex === 0 || articles.slice(0, currentIndex).every(a => a.skipped)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Zurück')}
        </Button>
        
        <span className="text-sm font-medium">
          {t('batchCapture.articleOf', 'Artikel {{current}} von {{total}}', { 
            current: currentPosition,
            total: activeCount 
          })}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNext}
          disabled={currentIndex === articles.length - 1 || articles.slice(currentIndex + 1).every(a => a.skipped)}
        >
          {t('common.next', 'Weiter')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5">
        {articles.map((article, i) => (
          <button
            key={article.imageId}
            onClick={() => !article.skipped && onIndexChange(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              article.skipped ? "bg-muted opacity-30" :
              i === currentIndex ? "bg-primary w-4" : "bg-muted hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      {/* Image preview with confidence */}
      <div className="relative">
        <img 
          src={currentArticle.imageBase64} 
          alt="" 
          className="w-full h-48 object-cover rounded-lg"
        />
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/90 text-sm">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className={cn(
              'font-medium',
              currentArticle.confidence === 'high' ? 'text-green-600' :
              currentArticle.confidence === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            )}>
              {currentArticle.confidence === 'high' ? t('quickCapture.highConfidence', 'Hoch') :
               currentArticle.confidence === 'medium' ? t('quickCapture.mediumConfidence', 'Mittel') :
               t('quickCapture.lowConfidence', 'Niedrig')}
            </span>
          </div>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2"
          onClick={handleSkip}
        >
          <SkipForward className="h-4 w-4 mr-1" />
          {t('batchCapture.skip', 'Überspringen')}
        </Button>
      </div>

      {/* Article Form */}
      <div className="grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="batchArticleName">{t('quickCapture.articleName', 'Artikelname')} *</Label>
          <Input
            id="batchArticleName"
            value={currentArticle.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder={t('quickCapture.articleNamePlaceholder', 'z.B. San Marzano Tomaten')}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label>{t('quickCapture.category', 'Kategorie')}</Label>
            <Select value={currentArticle.category} onValueChange={(v) => handleChange('category', v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('quickCapture.selectCategory', 'Wählen...')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t('quickCapture.unit', 'Einheit')}</Label>
            <Select value={currentArticle.unit} onValueChange={(v) => handleChange('unit', v)}>
              <SelectTrigger>
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

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="batchArticlePrice">{t('quickCapture.price', 'Preis (€)')} *</Label>
            <Input
              id="batchArticlePrice"
              type="text"
              inputMode="decimal"
              value={currentArticle.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="batchArticleSku">{t('quickCapture.sku', 'Art.-Nr.')}</Label>
            <Input
              id="batchArticleSku"
              value={currentArticle.sku}
              onChange={(e) => handleChange('sku', e.target.value)}
              placeholder={t('quickCapture.skuPlaceholder', 'Optional')}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="batchArticleDescription">{t('quickCapture.description', 'Beschreibung')}</Label>
          <Textarea
            id="batchArticleDescription"
            value={currentArticle.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder={t('quickCapture.descriptionPlaceholder', 'Optionale Beschreibung')}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
};
