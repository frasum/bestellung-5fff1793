import { useTranslation } from 'react-i18next';
import { Camera, Check, Layers } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { WizardStep } from './types';

interface PhotoCaptureHeaderProps {
  organizationName: string;
  step: WizardStep;
  batchMode: boolean;
  setBatchMode: (mode: boolean) => void;
  setStep: (step: WizardStep) => void;
  setCapturedImages: (images: []) => void;
  setPreviewImage: (image: null) => void;
  steps: string[];
  currentStepIndex: number;
}

export const PhotoCaptureHeader = ({
  organizationName,
  step,
  batchMode,
  setBatchMode,
  setStep,
  setCapturedImages,
  setPreviewImage,
  steps,
  currentStepIndex,
}: PhotoCaptureHeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold">{t('quickCapture.title', 'Schnell-Erfassung')}</h1>
            <p className="text-xs text-muted-foreground">{organizationName}</p>
          </div>
        </div>
        
        {/* Batch mode toggle - only show on photo step */}
        {(step === 'photo' || step === 'batch-photos') && (
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={batchMode}
              onCheckedChange={(checked) => {
                setBatchMode(checked);
                setStep(checked ? 'batch-photos' : 'photo');
                setCapturedImages([]);
                setPreviewImage(null);
              }}
            />
            <span className="text-xs text-muted-foreground">Batch</span>
          </div>
        )}
      </div>
      
      {/* Progress Steps */}
      {step !== 'batch-processing' && (
        <div className="flex items-center justify-between mt-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
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
      )}
    </header>
  );
};
