import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WizardStep } from './types';

interface WizardProgressProps {
  currentStep: WizardStep;
}

export const WizardProgress = memo(function WizardProgress({ currentStep }: WizardProgressProps) {
  const { t } = useTranslation();

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'capture', label: t('quickCapture.stepCapture', 'Erfassung') },
    { key: 'article', label: t('quickCapture.stepArticle', 'Artikel') },
    { key: 'supplier', label: t('quickCapture.stepSupplier', 'Lieferant') },
    { key: 'confirm', label: t('quickCapture.stepConfirm', 'Fertig') },
  ];

  const currentStepIndex = currentStep === 'voice-results' ? 0 : steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-between mb-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
            i < currentStepIndex ? 'bg-primary text-primary-foreground' :
            i === currentStepIndex ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' :
            'bg-muted text-muted-foreground'
          )}>
            {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              'w-8 sm:w-12 h-0.5 mx-1',
              i < currentStepIndex ? 'bg-primary' : 'bg-muted'
            )} />
          )}
        </div>
      ))}
    </div>
  );
});
