import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PenLine, Camera, Loader2, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FreeItem {
  id: string; // Temporary ID for UI tracking
  name: string;
  quantity: number;
  unit: string;
  supplier_id: string;
}

interface FreeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: Omit<FreeItem, 'id'>) => void;
  supplierId: string;
  editingItem?: FreeItem | null;
  onUpdate?: (item: FreeItem) => void;
  // New props for photo capture
  token?: string;
  organizationId?: string;
  canCapturePhotos?: boolean;
}

export function FreeItemDialog({ 
  open, 
  onOpenChange, 
  onAdd, 
  supplierId,
  editingItem,
  onUpdate,
  token,
  organizationId,
  canCapturePhotos = false,
}: FreeItemDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(editingItem?.name || '');
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);
  const [unit, setUnit] = useState(editingItem?.unit || 'Stk');
  
  // Photo capture states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiCategory, setAiCategory] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when dialog opens/closes or editing item changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && editingItem) {
      setName(editingItem.name);
      setQuantity(editingItem.quantity);
      setUnit(editingItem.unit);
    } else if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const resetForm = () => {
    setName('');
    setQuantity(1);
    setUnit('Stk');
    setCapturedImage(null);
    setAiCategory(null);
    setIsAnalyzing(false);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setCapturedImage(base64);
      
      // Analyze with AI
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (imageBase64: string) => {
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke('identify-article', {
        body: { 
          imageBase64,
          supplierId,
          organizationId,
        }
      });

      if (response.error) {
        console.error('AI analysis error:', response.error);
        toast.error(t('simpleOrder.aiAnalysisFailed', 'KI-Analyse fehlgeschlagen'));
        return;
      }

      const data = response.data;
      if (data) {
        // Pre-fill form with AI suggestions
        if (data.suggested_name && !name) {
          setName(data.suggested_name);
        }
        if (data.suggested_unit) {
          setUnit(data.suggested_unit);
        }
        if (data.suggested_category) {
          setAiCategory(data.suggested_category);
        }
        toast.success(t('simpleOrder.aiAnalysisSuccess', 'Artikel erkannt!'));
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error(t('simpleOrder.aiAnalysisFailed', 'KI-Analyse fehlgeschlagen'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removePhoto = () => {
    setCapturedImage(null);
    setAiCategory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImageToStorage = async (base64: string): Promise<string | null> => {
    try {
      // Convert base64 to blob
      const base64Data = base64.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      // Generate unique filename
      const fileName = `free-item-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `${organizationId}/${fileName}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('article-images')
        .upload(filePath, blob, { contentType: 'image/jpeg' });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    
    // Add free item to order
    if (editingItem && onUpdate) {
      onUpdate({
        ...editingItem,
        name: name.trim(),
        quantity,
        unit: unit.trim() || 'Stk',
      });
    } else {
      onAdd({
        name: name.trim(),
        quantity,
        unit: unit.trim() || 'Stk',
        supplier_id: supplierId,
      });
    }
    
    // Create suggestion with photo if captured
    if (capturedImage && token && organizationId && !editingItem) {
      try {
        // Upload image first
        const imageUrl = await uploadImageToStorage(capturedImage);
        
        // Create suggestion via edge function
        const response = await supabase.functions.invoke('create-photo-suggestion', {
          body: {
            token,
            name: name.trim(),
            category: aiCategory,
            unit: unit.trim() || 'Stk',
            supplier_id: supplierId,
            image_url: imageUrl,
          }
        });

        if (response.error) {
          console.error('Error creating suggestion:', response.error);
        } else {
          console.log('Photo suggestion created successfully');
        }
      } catch (error) {
        console.error('Error creating photo suggestion:', error);
      }
    }
    
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            {editingItem 
              ? t('simpleOrder.editFreeItem', 'Freien Artikel bearbeiten')
              : t('simpleOrder.addFreeItem', 'Freien Artikel hinzufügen')
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Photo Capture Section */}
          {canCapturePhotos && !editingItem && (
            <div className="space-y-2">
              <Label>{t('simpleOrder.articlePhoto', 'Artikelfoto')}</Label>
              
              {capturedImage ? (
                <div className="relative">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{t('simpleOrder.analyzing', 'Analysiere...')}</span>
                      </div>
                    </div>
                  )}
                  {!isAnalyzing && aiCategory && (
                    <div className="absolute bottom-2 left-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {t('simpleOrder.aiRecognized', 'KI erkannt')}
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={removePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed flex flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-6 w-6" />
                    <span className="text-sm">{t('simpleOrder.takePhoto', 'Foto aufnehmen')}</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="free-item-name">
              {t('simpleOrder.freeItemName', 'Artikelname')} *
            </Label>
            <Input
              id="free-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('simpleOrder.freeItemNamePlaceholder', 'z.B. Sonderartikel...')}
              autoFocus={!canCapturePhotos}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="free-item-quantity">
                {t('simpleOrder.quantity', 'Menge')} *
              </Label>
              <Input
                id="free-item-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="free-item-unit">
                {t('simpleOrder.unit', 'Einheit')}
              </Label>
              <Input
                id="free-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Stk"
              />
            </div>
          </div>

          {aiCategory && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {t('simpleOrder.suggestedCategory', 'Vorgeschlagene Kategorie')}: {aiCategory}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Abbrechen')}
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || isAnalyzing}>
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {editingItem 
              ? t('common.save', 'Speichern')
              : t('common.add', 'Hinzufügen')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
