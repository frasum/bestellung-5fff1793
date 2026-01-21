import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmStepProps {
  articleName: string;
  createdArticlesCount: number;
  onCaptureNext: () => void;
  onClose: () => void;
}

export const ConfirmStep = memo(function ConfirmStep({
  articleName,
  createdArticlesCount,
  onCaptureNext,
  onClose,
}: ConfirmStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div>
          {createdArticlesCount > 1 ? (
            <>
              <h3 className="text-lg font-semibold">
                {t('quickCapture.successTitleBatch', '{{count}} Artikel erfolgreich erstellt!', { count: createdArticlesCount })}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('quickCapture.successDescriptionBatch', 'Alle Artikel wurden zu deinem Katalog hinzugefügt.')}
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold">{t('quickCapture.successTitle', 'Artikel erfolgreich erstellt!')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('quickCapture.successDescription', '"{{name}}" wurde zu deinem Katalog hinzugefügt.', { name: articleName })}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={onCaptureNext} className="w-full">
          <Camera className="h-4 w-4 mr-2" />
          {t('quickCapture.captureNext', 'Nächsten Artikel erfassen')}
        </Button>
        <Button variant="outline" onClick={onClose} className="w-full">
          {t('common.done', 'Fertig')}
        </Button>
      </div>
    </div>
  );
});
