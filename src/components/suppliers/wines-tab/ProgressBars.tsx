import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { BatchProgress } from './types';

interface ProgressBarsProps {
  pdfProgress: { current: number; total: number } | null;
  batchProgress: BatchProgress | null;
  translateProgress: BatchProgress | null;
}

export const ProgressBars = ({
  pdfProgress,
  batchProgress,
  translateProgress,
}: ProgressBarsProps) => {
  const { t } = useTranslation();
  
  return (
    <>
      {/* PDF Progress */}
      {pdfProgress && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('wines.generatingPdf', 'Erstelle PDF...')}
            </span>
            <span className="text-muted-foreground">
              {pdfProgress.current} / {pdfProgress.total}
            </span>
          </div>
          <Progress value={(pdfProgress.current / pdfProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Batch Progress */}
      {batchProgress && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('wines.researching', 'Recherchiere')}: <span className="font-medium text-foreground">{batchProgress.wineName}</span>
            </span>
            <span className="text-muted-foreground">
              {batchProgress.current} / {batchProgress.total}
            </span>
          </div>
          <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Translation Progress */}
      {translateProgress && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('wines.translating', 'Übersetze')}: <span className="font-medium text-foreground">{translateProgress.wineName}</span>
            </span>
            <span className="text-muted-foreground">
              {translateProgress.current} / {translateProgress.total}
            </span>
          </div>
          <Progress value={(translateProgress.current / translateProgress.total) * 100} className="h-2" />
        </div>
      )}
    </>
  );
};
