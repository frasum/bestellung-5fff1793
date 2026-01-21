import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface BatchProcessingStepProps {
  batchProgress: { total: number; completed: number };
}

export const BatchProcessingStep = ({ batchProgress }: BatchProcessingStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">
          {t('batchCapture.analyzing', 'Analysiere Bilder...')}
        </h2>
        <p className="text-muted-foreground">
          {t('batchCapture.progress', '{{completed}} von {{total}}', batchProgress)}
        </p>
      </div>
      <Progress value={(batchProgress.completed / batchProgress.total) * 100} className="w-64" />
    </div>
  );
};
