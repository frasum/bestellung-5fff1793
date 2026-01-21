import { Wine, FileDown, Sparkles, Languages, Gamepad2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { BatchProgress } from './types';

interface WinesTabHeaderProps {
  wineArticlesCount: number;
  suppliersCount: number;
  winesToResearchCount: number;
  advancedMode: boolean;
  pdfProgress: { current: number; total: number } | null;
  batchProgress: BatchProgress | null;
  translateProgress: BatchProgress | null;
  onQuizOpen: () => void;
  onGeneratePdf: () => void;
  onBatchResearch: () => void;
  onBatchTranslate: () => void;
}

export const WinesTabHeader = ({
  wineArticlesCount,
  suppliersCount,
  winesToResearchCount,
  advancedMode,
  pdfProgress,
  batchProgress,
  translateProgress,
  onQuizOpen,
  onGeneratePdf,
  onBatchResearch,
  onBatchTranslate,
}: WinesTabHeaderProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wine className="h-5 w-5" />
        <span className="text-sm">
          {t('wines.totalWines', '{{count}} Weine von {{suppliers}} Lieferanten', {
            count: wineArticlesCount,
            suppliers: suppliersCount
          })}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Quiz Button */}
        <Button
          variant="default"
          size="sm"
          onClick={onQuizOpen}
          disabled={wineArticlesCount < 4}
          className="gap-2"
        >
          <Gamepad2 className="h-4 w-4" />
          {t('wines.quiz', 'Quiz starten')}
        </Button>

        {/* PDF Export Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onGeneratePdf}
          disabled={pdfProgress !== null || wineArticlesCount === 0}
          className="gap-2"
        >
          {pdfProgress ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {t('wines.exportPdf', 'Weinkarte PDF')}
        </Button>

        {/* Batch Research Button - only in advanced mode */}
        {advancedMode && winesToResearchCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBatchResearch}
            disabled={batchProgress !== null || translateProgress !== null}
            className="gap-2"
          >
            {batchProgress ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t('wines.batchResearch', 'Alle recherchieren')}
            <Badge variant="secondary" className="ml-1">
              {winesToResearchCount}
            </Badge>
          </Button>
        )}

        {/* Batch Translate Button */}
        {wineArticlesCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBatchTranslate}
            disabled={batchProgress !== null || translateProgress !== null}
            className="gap-2"
          >
            {translateProgress ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            {t('wines.batchTranslate', 'Alle übersetzen')}
          </Button>
        )}
      </div>
    </div>
  );
};
