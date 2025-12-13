import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, X, Plus, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface CapturedImage {
  id: string;
  base64: string;
  file?: File;
}

interface BatchPhotoGalleryProps {
  images: CapturedImage[];
  onAddImage: (image: CapturedImage) => void;
  onRemoveImage: (id: string) => void;
  onProcessAll: () => void;
  isProcessing: boolean;
  maxImages?: number;
}

export const BatchPhotoGallery = ({
  images,
  onAddImage,
  onRemoveImage,
  onProcessAll,
  isProcessing,
  maxImages = 20,
}: BatchPhotoGalleryProps) => {
  const { t } = useTranslation();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      if (images.length + i >= maxImages) {
        toast.error(t('batchCapture.maxImagesReached', 'Maximal {{max}} Bilder erlaubt', { max: maxImages }));
        break;
      }

      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('quickCapture.imageTooLarge', 'Bild ist zu groß (max. 5MB)'));
        continue;
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      onAddImage({
        id: `${Date.now()}-${i}`,
        base64,
        file,
      });
    }

    e.target.value = '';
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Image Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((img) => (
          <div key={img.id} className="relative aspect-square group">
            <img
              src={img.base64}
              alt=""
              className="w-full h-full object-cover rounded-lg border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemoveImage(img.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {/* Add more button */}
        {canAddMore && (
          <button
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              "aspect-square rounded-lg border-2 border-dashed border-primary/30",
              "flex flex-col items-center justify-center gap-1",
              "hover:border-primary/50 hover:bg-primary/5 transition-colors",
              "text-muted-foreground hover:text-primary"
            )}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">{t('batchCapture.addMore', 'Hinzufügen')}</span>
          </button>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        {images.length === 0 ? (
          <>
            <Button
              variant="default"
              size="lg"
              className="h-14"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-5 w-5 mr-2" />
              {t('quickCapture.takePhoto', 'Foto aufnehmen')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5 mr-2" />
              {t('batchCapture.uploadMultiple', 'Mehrere hochladen')}
            </Button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => cameraInputRef.current?.click()}
                disabled={!canAddMore}
              >
                <Camera className="h-5 w-5 mr-2" />
                {t('batchCapture.addPhoto', 'Weiteres Foto')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddMore}
              >
                <Upload className="h-5 w-5 mr-2" />
                {t('batchCapture.upload', 'Hochladen')}
              </Button>
            </div>
            <Button
              variant="default"
              size="lg"
              className="h-14"
              onClick={onProcessAll}
              disabled={isProcessing || images.length === 0}
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              {t('batchCapture.processAll', 'Alle {{count}} verarbeiten', { count: images.length })}
            </Button>
          </>
        )}
      </div>

      {/* Counter */}
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {t('batchCapture.imageCount', '{{count}} von {{max}} Fotos', { count: images.length, max: maxImages })}
        </p>
      )}
    </div>
  );
};
