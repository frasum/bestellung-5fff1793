import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ArticleCarousel, BatchArticleData } from '@/components/suppliers/ArticleCarousel';

interface BatchReviewStepProps {
  batchArticles: BatchArticleData[];
  currentBatchIndex: number;
  setCurrentBatchIndex: (index: number) => void;
  onArticleChange: (index: number, data: Partial<BatchArticleData>) => void;
  onSkipArticle: (index: number) => void;
  categories: string[];
  units: string[];
  canProceedToSupplier: boolean;
  onBack: () => void;
  onNext: () => void;
}

export const BatchReviewStep = ({
  batchArticles,
  currentBatchIndex,
  setCurrentBatchIndex,
  onArticleChange,
  onSkipArticle,
  categories,
  units,
  canProceedToSupplier,
  onBack,
  onNext,
}: BatchReviewStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <ArticleCarousel
        articles={batchArticles}
        currentIndex={currentBatchIndex}
        onIndexChange={setCurrentBatchIndex}
        onArticleChange={onArticleChange}
        onSkipArticle={onSkipArticle}
        categories={categories}
        units={units}
      />
      
      <div className="flex justify-between pt-4 border-t">
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Zurück')}
        </Button>
        <Button size="lg" onClick={onNext} disabled={!canProceedToSupplier}>
          {t('batchCapture.toSupplier', 'Lieferant wählen')}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};
