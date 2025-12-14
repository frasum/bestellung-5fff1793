import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Loader2, Check, X, Sparkles, AlertCircle } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Article {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  category: string | null;
  supplier_id: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface IdentificationResult {
  matchedArticle?: {
    id: string;
    name: string;
    similarity: number;
  } | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  suggestedName?: string;
  suggestedCategory?: string;
  suggestedUnit?: string;
  suggestedDescription?: string;
}

interface PhotoCaptureAssignmentDialogProps {
  article: Article;
  suppliers: Supplier[];
  categories: Category[];
  organizationId: string;
  token: string;
  onComplete: (articleId: string) => void;
  onCancel: () => void;
}

export const PhotoCaptureAssignmentDialog = ({
  article,
  suppliers,
  categories,
  organizationId,
  token,
  onComplete,
  onCancel,
}: PhotoCaptureAssignmentDialogProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  
  // Form state for new article suggestion
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [suggestionData, setSuggestionData] = useState({
    name: '',
    description: '',
    category: '',
    unit: 'Stk',
    supplier_id: article.supplier_id,
  });

  const processImage = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error(t('photoCapture.invalidFile', 'Bitte wähle eine Bilddatei'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('photoCapture.fileTooLarge', 'Bild darf max. 10MB sein'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setImageFile(file);
      
      // Analyze with AI
      await analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true);
    setIdentificationResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('identify-article', {
        body: {
          imageBase64: base64.split(',')[1], // Remove data:image prefix
          supplierId: article.supplier_id,
          organizationId,
          targetArticleId: article.id, // Hint for matching
        },
      });

      if (error) throw error;

      const result: IdentificationResult = {
        matchedArticle: data?.matchedArticle,
        confidence: data?.confidence || 'none',
        suggestedName: data?.suggestedName || article.name,
        suggestedCategory: data?.suggestedCategory || article.category || '',
        suggestedUnit: data?.suggestedUnit || article.unit,
        suggestedDescription: data?.suggestedDescription,
      };

      setIdentificationResult(result);

      // Check if AI matched the target article
      if (result.matchedArticle?.id === article.id && result.confidence !== 'none') {
        // Direct match - can upload immediately
        toast.success(t('photoCapture.matchFound', 'Artikel erkannt!'));
      } else if (result.confidence === 'none' || !result.matchedArticle) {
        // No match - show suggestion form
        setShowSuggestionForm(true);
        setSuggestionData({
          name: result.suggestedName || article.name,
          description: result.suggestedDescription || '',
          category: result.suggestedCategory || '',
          unit: result.suggestedUnit || 'Stk',
          supplier_id: article.supplier_id,
        });
      }
    } catch (err) {
      console.error('Error analyzing image:', err);
      toast.error(t('photoCapture.analysisFailed', 'Analyse fehlgeschlagen'));
      // Allow manual upload anyway
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleUploadToArticle = async () => {
    if (!imageFile) return;

    setIsUploading(true);

    try {
      // Upload to storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${article.id}-${Date.now()}.${fileExt}`;
      const filePath = `${organizationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      // Update article with image URL via edge function
      const { error: updateError } = await supabase.functions.invoke('update-article-image', {
        body: {
          token,
          articleId: article.id,
          imageUrl: urlData.publicUrl,
        },
      });

      if (updateError) throw updateError;

      toast.success(t('photoCapture.uploaded', 'Foto gespeichert!'));
      onComplete(article.id);
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error(t('photoCapture.uploadFailed', 'Upload fehlgeschlagen'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateSuggestion = async () => {
    if (!imageFile || !suggestionData.name.trim()) return;

    setIsUploading(true);

    try {
      // Upload image first
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `suggestion-${Date.now()}.${fileExt}`;
      const filePath = `${organizationId}/suggestions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('article-images')
        .getPublicUrl(filePath);

      // Create suggested article via edge function
      const { error: suggestError } = await supabase.functions.invoke('create-photo-suggestion', {
        body: {
          token,
          name: suggestionData.name.trim(),
          description: suggestionData.description.trim() || null,
          category: suggestionData.category || null,
          unit: suggestionData.unit,
          supplier_id: suggestionData.supplier_id,
          image_url: urlData.publicUrl,
          original_article_id: article.id, // Reference to article we were trying to photograph
        },
      });

      if (suggestError) throw suggestError;

      toast.success(t('photoCapture.suggestionCreated', 'Vorschlag gesendet!'));
      onComplete(article.id);
    } catch (err) {
      console.error('Error creating suggestion:', err);
      toast.error(t('photoCapture.suggestionFailed', 'Vorschlag fehlgeschlagen'));
    } finally {
      setIsUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setIdentificationResult(null);
    setShowSuggestionForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getConfidenceBadge = () => {
    if (!identificationResult) return null;
    
    const { confidence, matchedArticle } = identificationResult;
    const isTargetMatch = matchedArticle?.id === article.id;
    
    if (isTargetMatch && confidence !== 'none') {
      return (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
          <Check className="h-5 w-5" />
          <span className="font-medium">
            {t('photoCapture.matchConfirmed', 'Artikel erkannt')} ({Math.round((matchedArticle?.similarity || 0) * 100)}%)
          </span>
        </div>
      );
    }
    
    if (matchedArticle && matchedArticle.id !== article.id) {
      return (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">
            {t('photoCapture.differentMatch', 'KI erkennt: {{name}}', { name: matchedArticle.name })}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-muted-foreground bg-muted px-3 py-2 rounded-lg">
        <Sparkles className="h-5 w-5" />
        <span className="text-sm">
          {t('photoCapture.noMatch', 'Kein Treffer - als Vorschlag senden')}
        </span>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {article.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image capture/preview area */}
          {!imagePreview ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                variant="outline"
                className="w-full h-32 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-8 w-8" />
                <span>{t('photoCapture.takePhoto', 'Foto aufnehmen')}</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-12 gap-2"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.removeAttribute('capture');
                    fileInputRef.current.click();
                    // Restore capture attribute after click
                    setTimeout(() => {
                      fileInputRef.current?.setAttribute('capture', 'environment');
                    }, 100);
                  }
                }}
              >
                <Upload className="h-5 w-5" />
                <span>{t('photoCapture.uploadPhoto', 'Aus Galerie wählen')}</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <span className="text-sm">{t('photoCapture.analyzing', 'Analysiere...')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Result */}
              {!isAnalyzing && identificationResult && getConfidenceBadge()}

              {/* Suggestion Form */}
              {showSuggestionForm && !isAnalyzing && (
                <div className="space-y-3 border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('photoCapture.adjustDetails', 'Details anpassen und als Vorschlag senden:')}
                  </p>
                  
                  <div className="space-y-2">
                    <Label>{t('common.name', 'Name')}</Label>
                    <Input
                      value={suggestionData.name}
                      onChange={(e) => setSuggestionData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('photoCapture.articleName', 'Artikelname')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('common.description', 'Beschreibung')}</Label>
                    <Input
                      value={suggestionData.description}
                      onChange={(e) => setSuggestionData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('photoCapture.descriptionPlaceholder', 'z.B. Weingut, Jahrgang, Herkunft...')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>{t('common.category', 'Kategorie')}</Label>
                      <Select
                        value={suggestionData.category}
                        onValueChange={(v) => setSuggestionData(prev => ({ ...prev, category: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.selectCategory', 'Wählen...')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('common.unit', 'Einheit')}</Label>
                      <Input
                        value={suggestionData.unit}
                        onChange={(e) => setSuggestionData(prev => ({ ...prev, unit: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('common.supplier', 'Lieferant')}</Label>
                    <Select
                      value={suggestionData.supplier_id}
                      onValueChange={(v) => setSuggestionData(prev => ({ ...prev, supplier_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            {t('common.cancel', 'Abbrechen')}
          </Button>
          
          {imagePreview && !isAnalyzing && (
            <>
              {/* Direct upload if AI matched the target article */}
              {identificationResult?.matchedArticle?.id === article.id && (
                <Button onClick={handleUploadToArticle} disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {t('photoCapture.savePhoto', 'Foto speichern')}
                </Button>
              )}
              
              {/* Suggestion button if no match or different match */}
              {showSuggestionForm && (
                <Button onClick={handleCreateSuggestion} disabled={isUploading || !suggestionData.name.trim()}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {t('photoCapture.sendSuggestion', 'Vorschlag senden')}
                </Button>
              )}
              
              {/* Force upload button even if AI didn't match */}
              {identificationResult && identificationResult.matchedArticle?.id !== article.id && !showSuggestionForm && (
                <Button variant="secondary" onClick={handleUploadToArticle} disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {t('photoCapture.uploadAnyway', 'Trotzdem speichern')}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
