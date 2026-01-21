import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Loader2, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SinglePhotoStepProps {
  previewImage: string | null;
  isAnalyzing: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  cameraInputRef: RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearPreview: () => void;
}

export const SinglePhotoStep = ({
  previewImage,
  isAnalyzing,
  fileInputRef,
  cameraInputRef,
  onFileSelect,
  onClearPreview,
}: SinglePhotoStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 min-h-[300px] flex flex-col items-center justify-center">
        {previewImage ? (
          <div className="relative w-full">
            <img src={previewImage} alt="Preview" className="w-full h-64 object-cover rounded-md" />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">{t('quickCapture.analyzing', 'Wird analysiert...')}</span>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-10 w-10 bg-background/80 hover:bg-background"
              onClick={onClearPreview}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-8 w-8" />
              <span className="text-lg font-medium">{t('quickCapture.aiRecognition', 'KI-Artikelerkennung')}</span>
            </div>
            
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFileSelect}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileSelect}
              />
              
              <Button
                variant="default"
                size="lg"
                className="h-16 text-lg"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                <Camera className="h-6 w-6 mr-2" />
                {t('quickCapture.takePhoto', 'Foto aufnehmen')}
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="h-14"
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
              >
                <Upload className="h-5 w-5 mr-2" />
                {t('quickCapture.uploadFile', 'Hochladen')}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              {t('quickCapture.photoHint', 'Fotografiere ein Produkt und die KI erkennt automatisch Name, Kategorie und Einheit.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
