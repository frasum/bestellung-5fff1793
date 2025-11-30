import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useArticles, Article } from '@/hooks/useArticles';
import { useCart } from '@/contexts/CartContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Camera, Upload, Loader2, Check, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface ScannedItem {
  recognized_text: string;
  quantity: number | null;
  matched_article_name: string | null;
  confidence: 'high' | 'medium' | 'low';
  // User corrections
  selected_article_id?: string;
  corrected_quantity?: number;
}

interface ScanOrderListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ScanOrderListDialog = ({ open, onOpenChange }: ScanOrderListDialogProps) => {
  const { t } = useTranslation();
  const { data: articles = [] } = useArticles();
  const { addItem } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await scanImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const scanImage = async (imageBase64: string) => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scan-order-list', {
        body: {
          imageBase64,
          articles: articles.map(a => ({
            id: a.id,
            name: a.name,
            sku: a.sku,
            unit: a.unit,
          })),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Process scanned items and pre-match articles
      const processedItems: ScannedItem[] = (data.items || []).map((item: ScannedItem) => {
        const matchedArticle = item.matched_article_name 
          ? articles.find(a => a.name.toLowerCase() === item.matched_article_name?.toLowerCase())
          : null;
        
        return {
          ...item,
          selected_article_id: matchedArticle?.id || '',
          corrected_quantity: item.quantity || 1,
        };
      });

      if (processedItems.length === 0) {
        toast.error('Keine Einträge erkannt. Bitte versuche es mit einem besseren Foto.');
        return;
      }

      setScannedItems(processedItems);
      setStep('review');
    } catch (error) {
      console.error('Scan error:', error);
      toast.error('Fehler beim Scannen. Bitte erneut versuchen.');
    } finally {
      setIsScanning(false);
    }
  };

  const updateItem = (index: number, field: 'selected_article_id' | 'corrected_quantity', value: string | number) => {
    setScannedItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (index: number) => {
    setScannedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddToCart = () => {
    let addedCount = 0;
    
    scannedItems.forEach(item => {
      if (item.selected_article_id && item.corrected_quantity && item.corrected_quantity > 0) {
        const article = articles.find(a => a.id === item.selected_article_id);
        if (article) {
          addItem(article, item.corrected_quantity);
          addedCount++;
        }
      }
    });

    if (addedCount > 0) {
      toast.success(`${addedCount} Artikel zum Warenkorb hinzugefügt`);
      handleClose();
    } else {
      toast.error('Keine gültigen Artikel zum Hinzufügen');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setScannedItems([]);
    onOpenChange(false);
  };

  const validItemsCount = scannedItems.filter(
    item => item.selected_article_id && item.corrected_quantity && item.corrected_quantity > 0
  ).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Bestellliste scannen
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' 
              ? 'Fotografiere oder lade eine ausgefüllte Bestellliste hoch'
              : 'Überprüfe und korrigiere die erkannten Einträge'}
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col items-center gap-4">
              {isScanning ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Analysiere Bestellliste...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-32 flex-col gap-2"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.setAttribute('capture', 'environment');
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Camera className="w-8 h-8" />
                      <span>Foto aufnehmen</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-32 flex-col gap-2"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute('capture');
                          fileInputRef.current.click();
                        }
                      }}
                    >
                      <Upload className="w-8 h-8" />
                      <span>Bild hochladen</span>
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Für beste Ergebnisse: Gute Beleuchtung, deutliche Handschrift, 
                    gesamte Liste im Bild
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {scannedItems.length} Einträge erkannt. Korrigiere bei Bedarf die Zuordnung.
            </p>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {scannedItems.map((item, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${
                    item.confidence === 'high' ? 'border-green-500/30 bg-green-500/5' :
                    item.confidence === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-red-500/30 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {item.confidence === 'high' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className={`w-4 h-4 ${
                          item.confidence === 'medium' ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                      )}
                      <span className="text-sm font-medium">
                        Erkannt: "{item.recognized_text}"
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-[1fr,100px] gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Artikel</Label>
                      <Select
                        value={item.selected_article_id || ''}
                        onValueChange={(value) => updateItem(index, 'selected_article_id', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Artikel auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {articles.map(article => (
                            <SelectItem key={article.id} value={article.id}>
                              {article.name} ({article.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Menge</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.corrected_quantity || ''}
                        onChange={(e) => updateItem(index, 'corrected_quantity', parseInt(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' ? (
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Neues Bild
              </Button>
              <Button 
                onClick={handleAddToCart}
                disabled={validItemsCount === 0}
              >
                {validItemsCount} Artikel hinzufügen
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
