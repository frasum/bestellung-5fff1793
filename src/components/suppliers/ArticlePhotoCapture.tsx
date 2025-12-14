import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, X, Sparkles, Check, AlertCircle, ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface IdentificationResult {
  matched_article_id: string | null;
  matched_article_name: string | null;
  confidence: 'high' | 'medium' | 'low';
  suggested_name: string;
  suggested_description: string;
  suggested_category: string;
  suggested_unit: string;
}

interface ArticlePhotoCaptureProps {
  supplierId: string | null;
  organizationId: string | null;
  existingImageUrl?: string | null;
  onImageCaptured: (base64Image: string, result: IdentificationResult) => void;
  onImageCleared: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

export const ArticlePhotoCapture = ({
  supplierId,
  organizationId,
  existingImageUrl,
  onImageCaptured,
  onImageCleared,
  isAnalyzing,
  setIsAnalyzing,
}: ArticlePhotoCaptureProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(existingImageUrl || null);
  const [lastResult, setLastResult] = useState<IdentificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte ein Bild auswählen');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild ist zu groß (max. 5MB)');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreviewImage(base64);

      // Call identify-article Edge Function
      const { data, error } = await supabase.functions.invoke('identify-article', {
        body: {
          imageBase64: base64,
          supplierId,
          organizationId,
        },
      });

      if (error) {
        console.error('Identification error:', error);
        toast.error('Fehler bei der Artikel-Identifikation');
        return;
      }

      const result = data as IdentificationResult;
      setLastResult(result);
      onImageCaptured(base64, result);

      if (result.matched_article_id) {
        toast.success(`Artikel erkannt: ${result.matched_article_name}`);
      } else if (result.confidence === 'high') {
        toast.success(`Produkt identifiziert: ${result.suggested_name}`);
      } else {
        toast.info('Bild analysiert - bitte Felder prüfen');
      }
    } catch (err) {
      console.error('Processing error:', err);
      toast.error('Fehler bei der Bildverarbeitung');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    // Reset input
    e.target.value = '';
  };

  const clearImage = () => {
    setPreviewImage(null);
    setLastResult(null);
    onImageCleared();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      
      for (const item of clipboardItems) {
        const imageType = item.types.find(type => type.startsWith('image/'));
        
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.png', { type: imageType });
          await processImage(file);
          return;
        }
      }
      
      toast.error('Kein Bild in der Zwischenablage gefunden');
    } catch (err) {
      console.error('Clipboard error:', err);
      toast.error('Zugriff auf Zwischenablage nicht möglich');
    }
  };

  // Global paste event listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (previewImage || isAnalyzing) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processImage(file);
            return;
          }
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [previewImage, isAnalyzing]);

  const getConfidenceBadge = () => {
    if (!lastResult) return null;
    
    const colors = {
      high: 'bg-green-500/20 text-green-600 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      low: 'bg-red-500/20 text-red-600 border-red-500/30',
    };

    const labels = {
      high: 'Hohe Sicherheit',
      medium: 'Mittlere Sicherheit',
      low: 'Niedrige Sicherheit',
    };

    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full border', colors[lastResult.confidence])}>
        {labels[lastResult.confidence]}
      </span>
    );
  };

  return (
    <div className="space-y-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4" />
        KI-Artikelerkennung
      </div>

      {previewImage ? (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={previewImage}
              alt="Artikel-Vorschau"
              className="w-full h-32 object-cover rounded-md"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Wird analysiert...</span>
                </div>
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
              onClick={clearImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {lastResult && !isAnalyzing && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                {lastResult.matched_article_id ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Existierender Artikel erkannt</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Neuer Artikel</span>
                  </>
                )}
              </div>
              {getConfidenceBadge()}
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
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
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            <Camera className="h-4 w-4 mr-2" />
            Kamera
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Datei
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={handlePasteFromClipboard}
            disabled={isAnalyzing}
          >
            <ClipboardPaste className="h-4 w-4 mr-2" />
            Einfügen
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Foto hochladen oder aus Zwischenablage einfügen (Strg+V)
      </p>
    </div>
  );
};
