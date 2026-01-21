import { useTranslation } from 'react-i18next';
import { BatchPhotoGallery, CapturedImage } from '@/components/suppliers/BatchPhotoGallery';

interface BatchPhotosStepProps {
  capturedImages: CapturedImage[];
  onAddImage: (image: CapturedImage) => void;
  onRemoveImage: (id: string) => void;
  onProcessAll: () => void;
}

export const BatchPhotosStep = ({
  capturedImages,
  onAddImage,
  onRemoveImage,
  onProcessAll,
}: BatchPhotosStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold">{t('batchCapture.title', 'Mehrere Artikel erfassen')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('batchCapture.hint', 'Mache Fotos von mehreren Produkten und verarbeite sie gemeinsam.')}
        </p>
      </div>
      
      <BatchPhotoGallery
        images={capturedImages}
        onAddImage={onAddImage}
        onRemoveImage={onRemoveImage}
        onProcessAll={onProcessAll}
        isProcessing={false}
      />
    </div>
  );
};
