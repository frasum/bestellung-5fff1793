import { useTranslation } from 'react-i18next';
import { Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BatchResult } from './types';

interface ConfirmationStepProps {
  batchMode: boolean;
  batchResult: BatchResult | null;
  articleName: string;
  onCaptureMore: () => void;
  onDone: () => void;
}

export const ConfirmationStep = ({
  batchMode,
  batchResult,
  articleName,
  onCaptureMore,
  onDone,
}: ConfirmationStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <div>
          {batchMode && batchResult ? (
            <>
              <h3 className="text-xl font-semibold">
                {t('batchCapture.successTitle', '{{count}} Artikel erstellt!', { count: batchResult.successCount })}
              </h3>
              {batchResult.failCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('batchCapture.failedCount', '{{count}} Artikel konnten nicht erstellt werden.', { count: batchResult.failCount })}
                </p>
              )}
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold">{t('quickCapture.successTitle', 'Artikel erfolgreich erstellt!')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('quickCapture.successDescription', '"{{name}}" wurde zu deinem Katalog hinzugefügt.', { name: articleName })}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button size="lg" className="h-14" onClick={onCaptureMore}>
          <Camera className="h-5 w-5 mr-2" />
          {batchMode 
            ? t('batchCapture.captureMore', 'Weitere Artikel erfassen')
            : t('quickCapture.captureNext', 'Nächsten Artikel erfassen')}
        </Button>
        <Button variant="outline" size="lg" className="h-14" onClick={onDone}>
          {t('common.done', 'Fertig')}
        </Button>
      </div>
    </div>
  );
};
