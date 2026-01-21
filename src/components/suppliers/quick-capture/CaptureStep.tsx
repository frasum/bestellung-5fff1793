import React, { memo, RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Loader2, X, Sparkles, Mic, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceInventoryCapture, ExtractedArticle } from '../VoiceInventoryCapture';
import { MobileQRCodeOption } from '../MobileQRCodeOption';
import { CaptureMode } from './types';

interface CaptureStepProps {
  captureMode: CaptureMode;
  onCaptureModeChange: (mode: CaptureMode) => void;
  previewImage: string | null;
  isAnalyzing: boolean;
  onClearPreview: () => void;
  onCameraClick: () => void;
  onUploadClick: () => void;
  onVoiceResult: (transcript: string, articles: ExtractedArticle[]) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  cameraInputRef: RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CaptureStep = memo(function CaptureStep({
  captureMode,
  onCaptureModeChange,
  previewImage,
  isAnalyzing,
  onClearPreview,
  onCameraClick,
  onUploadClick,
  onVoiceResult,
  fileInputRef,
  cameraInputRef,
  onFileSelect,
}: CaptureStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <Tabs value={captureMode} onValueChange={(v) => onCaptureModeChange(v as CaptureMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="photo" className="gap-1.5">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quickCapture.tabPhoto', 'Foto')}</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="gap-1.5">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quickCapture.tabVoice', 'Sprache')}</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="gap-1.5">
            <Smartphone className="h-4 w-4" />
            <span className="hidden sm:inline">{t('quickCapture.tabMobile', 'Handy')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="photo" className="mt-4">
          <div className="p-6 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
            {previewImage ? (
              <div className="relative">
                <img src={previewImage} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">{t('quickCapture.analyzing', 'Wird analysiert...')}</span>
                    </div>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={onClearPreview}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-6 w-6" />
                  <span className="font-medium">{t('quickCapture.aiRecognition', 'KI-Artikelerkennung')}</span>
                </div>
                
                <div className="flex gap-3">
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
                    className="h-14 px-6"
                    onClick={onCameraClick}
                    disabled={isAnalyzing}
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    {t('quickCapture.takePhoto', 'Foto aufnehmen')}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-14 px-6"
                    onClick={onUploadClick}
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
        </TabsContent>

        <TabsContent value="voice" className="mt-4">
          <div className="p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
            <VoiceInventoryCapture
              language={t('locale', 'de')}
              onResult={onVoiceResult}
            />
          </div>
        </TabsContent>

        <TabsContent value="mobile" className="mt-4">
          <MobileQRCodeOption onBack={() => onCaptureModeChange('photo')} />
        </TabsContent>
      </Tabs>
    </div>
  );
});
