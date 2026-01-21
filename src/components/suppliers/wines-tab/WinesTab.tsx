import { Wine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WineQuizGame } from '@/components/wine-quiz/WineQuizGame';
import { WinesTabProps, FilterMode } from './types';
import { useWinesTabState } from './useWinesTabState';
import { WinesTabHeader } from './WinesTabHeader';
import { WinesTabFilters } from './WinesTabFilters';
import { ProgressBars } from './ProgressBars';
import { SupplierWinesList } from './SupplierWinesList';

export const WinesTab = ({ articles, suppliers, onEditArticle }: WinesTabProps) => {
  const { t } = useTranslation();
  
  const {
    openSuppliers,
    setOpenSuppliers,
    batchProgress,
    translateProgress,
    pdfProgress,
    filterMode,
    setFilterMode,
    advancedMode,
    quizOpen,
    setQuizOpen,
    wineArticles,
    incompleteCount,
    filteredWines,
    winesToResearch,
    winesBySupplier,
    suppliersWithWines,
    handleGeneratePdf,
    handleBatchResearch,
    handleBatchTranslate,
  } = useWinesTabState(articles, suppliers);

  // Empty state - no wines
  if (wineArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wine className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t('wines.noWines', 'Keine Weine im Katalog')}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {t('wines.noWinesDescription', 'Fügen Sie Artikel mit der Kategorie "Wein" hinzu, um sie hier anzuzeigen.')}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <WinesTabHeader
          wineArticlesCount={wineArticles.length}
          suppliersCount={suppliers.filter(s => wineArticles.some(w => w.supplier_id === s.id)).length}
          winesToResearchCount={winesToResearch.length}
          advancedMode={advancedMode}
          pdfProgress={pdfProgress}
          batchProgress={batchProgress}
          translateProgress={translateProgress}
          onQuizOpen={() => setQuizOpen(true)}
          onGeneratePdf={handleGeneratePdf}
          onBatchResearch={handleBatchResearch}
          onBatchTranslate={handleBatchTranslate}
        />

        <ProgressBars
          pdfProgress={pdfProgress}
          batchProgress={batchProgress}
          translateProgress={translateProgress}
        />

        <WinesTabFilters
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          wineArticles={wineArticles}
          incompleteCount={incompleteCount}
        />

        {/* Empty state for filter */}
        {filteredWines.length === 0 && filterMode !== 'all' && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Wine className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted-foreground">
              {t('wines.noIncompleteWines', 'Alle Weine sind vollständig!')}
            </p>
          </div>
        )}

        <SupplierWinesList
          suppliersWithWines={suppliersWithWines}
          winesBySupplier={winesBySupplier}
          openSuppliers={openSuppliers}
          setOpenSuppliers={setOpenSuppliers}
          onEditArticle={onEditArticle}
        />
      </div>

      <WineQuizGame 
        wines={wineArticles} 
        open={quizOpen} 
        onOpenChange={setQuizOpen} 
      />
    </>
  );
};
