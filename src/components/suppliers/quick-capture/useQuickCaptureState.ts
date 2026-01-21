import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArticleInput } from '@/hooks/useArticles';
import { SupplierInput, Supplier } from '@/hooks/useSuppliers';
import { ExtractedArticle } from '../VoiceInventoryCapture';
import { 
  WizardStep, 
  CaptureMode, 
  IdentificationResult,
  QuickCaptureWizardProps,
} from './types';

export function useQuickCaptureState(props: QuickCaptureWizardProps) {
  const { t } = useTranslation();
  const { suppliers, onCreateSupplier, onCreateArticle, onUploadImage, organizationId } = props;
  
  // Wizard state
  const [step, setStep] = useState<WizardStep>('capture');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('photo');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Photo state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Article form state
  const [articleName, setArticleName] = useState('');
  const [articleDescription, setArticleDescription] = useState('');
  const [articleCategory, setArticleCategory] = useState('');
  const [articleUnit, setArticleUnit] = useState('');
  const [articlePrice, setArticlePrice] = useState('');
  const [articleSku, setArticleSku] = useState('');
  
  // Voice inventory state
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceArticles, setVoiceArticles] = useState<ExtractedArticle[]>([]);
  const [voiceArticleQueue, setVoiceArticleQueue] = useState<ExtractedArticle[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [createdArticlesCount, setCreatedArticlesCount] = useState(0);
  
  // Supplier state
  const [supplierMode, setSupplierMode] = useState<'existing' | 'new'>('existing');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierCustomerNumber, setNewSupplierCustomerNumber] = useState('');

  const resetWizard = useCallback(() => {
    setStep('capture');
    setCaptureMode('photo');
    setPreviewImage(null);
    setIdentificationResult(null);
    setArticleName('');
    setArticleDescription('');
    setArticleCategory('');
    setArticleUnit('');
    setArticlePrice('');
    setArticleSku('');
    setSupplierMode('existing');
    setSelectedSupplierId('');
    setSupplierSearch('');
    setNewSupplierName('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierCustomerNumber('');
    setVoiceTranscript('');
    setVoiceArticles([]);
    setVoiceArticleQueue([]);
    setCurrentQueueIndex(0);
    setCreatedArticlesCount(0);
  }, []);

  const loadArticleFromQueue = useCallback((article: ExtractedArticle) => {
    setArticleName(article.name);
    setArticleCategory(article.category || '');
    setArticleUnit(article.unit || 'Stk');
    setArticleDescription(article.size ? `Gebindegröße: ${article.size}` : '');
    setArticlePrice('');
    setArticleSku('');
  }, []);

  const handleVoiceResult = useCallback((transcript: string, articles: ExtractedArticle[]) => {
    setVoiceTranscript(transcript);
    setVoiceArticles(articles);
    if (articles.length > 0) {
      setStep('voice-results');
    } else {
      toast.info(t('voiceInventory.noArticlesFound', 'Keine Artikel erkannt'));
    }
  }, [t]);

  const handleVoiceArticlesConfirm = useCallback((confirmedArticles: ExtractedArticle[]) => {
    if (confirmedArticles.length === 0) return;
    
    setVoiceArticleQueue(confirmedArticles);
    setCurrentQueueIndex(0);
    setCreatedArticlesCount(0);
    loadArticleFromQueue(confirmedArticles[0]);
    
    if (confirmedArticles.length > 1) {
      toast.info(t('voiceInventory.processingBatch', '{{count}} Artikel erkannt - nacheinander verarbeiten', { count: confirmedArticles.length }));
    }
    
    setStep('article');
  }, [t, loadArticleFromQueue]);

  const processImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('quickCapture.invalidImage', 'Bitte ein Bild auswählen'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('quickCapture.imageTooLarge', 'Bild ist zu groß (max. 5MB)'));
      return;
    }

    setIsAnalyzing(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreviewImage(base64);

      const { data, error } = await supabase.functions.invoke('identify-article', {
        body: { imageBase64: base64, organizationId },
      });

      if (error) {
        console.error('Identification error:', error);
        toast.error(t('quickCapture.identificationError', 'Fehler bei der Artikel-Identifikation'));
        return;
      }

      const result = data as IdentificationResult;
      setIdentificationResult(result);
      setArticleName(result.suggested_name || '');
      setArticleDescription(result.suggested_description || '');
      setArticleCategory(result.suggested_category || '');
      setArticleUnit(result.suggested_unit || 'Stk');

      if (result.confidence === 'high') {
        toast.success(t('quickCapture.productIdentified', 'Produkt identifiziert: {{name}}', { name: result.suggested_name }));
      } else {
        toast.info(t('quickCapture.imageAnalyzed', 'Bild analysiert - bitte Felder prüfen'));
      }

      setStep('article');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Processing error:', message);
      toast.error(t('quickCapture.processingError', 'Fehler bei der Bildverarbeitung'));
    } finally {
      setIsAnalyzing(false);
    }
  }, [t, organizationId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    e.target.value = '';
  }, [processImage]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!articleName.trim() || !articlePrice) {
      toast.error(t('quickCapture.fillRequired', 'Bitte alle Pflichtfelder ausfüllen'));
      return false;
    }

    setIsSaving(true);

    try {
      let supplierId = selectedSupplierId;

      if (supplierMode === 'new') {
        if (!newSupplierName.trim() || !newSupplierEmail.trim()) {
          toast.error(t('quickCapture.supplierRequired', 'Lieferanten-Name und E-Mail sind erforderlich'));
          setIsSaving(false);
          return false;
        }

        const newSupplier = await onCreateSupplier({
          name: newSupplierName.trim(),
          email: newSupplierEmail.trim(),
          phone: newSupplierPhone.trim() || undefined,
          customer_number: newSupplierCustomerNumber.trim() || undefined,
        });
        supplierId = newSupplier.id;
        setSelectedSupplierId(supplierId);
        setSupplierMode('existing');
        toast.success(t('quickCapture.supplierCreated', 'Lieferant "{{name}}" erstellt', { name: newSupplierName }));
      }

      if (!supplierId) {
        toast.error(t('quickCapture.selectSupplier', 'Bitte einen Lieferanten auswählen'));
        setIsSaving(false);
        return false;
      }

      const articleInput: ArticleInput = {
        supplier_id: supplierId,
        name: articleName.trim(),
        description: articleDescription.trim() || undefined,
        category: articleCategory || undefined,
        unit: articleUnit || 'Stk',
        price: parseFloat(articlePrice.replace(',', '.')) || 0,
        sku: articleSku.trim() || undefined,
      };

      const newArticle = await onCreateArticle(articleInput);

      if (previewImage && previewImage.startsWith('data:') && newArticle && organizationId) {
        await onUploadImage(previewImage, organizationId, newArticle.id);
      }

      toast.success(t('quickCapture.articleCreated', 'Artikel "{{name}}" erfolgreich erstellt!', { name: articleName }));
      setCreatedArticlesCount(prev => prev + 1);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Save error:', message);
      toast.error(t('quickCapture.saveError', 'Fehler beim Speichern'));
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [
    articleName, articlePrice, articleDescription, articleCategory, articleUnit, articleSku,
    supplierMode, selectedSupplierId, newSupplierName, newSupplierEmail, newSupplierPhone, newSupplierCustomerNumber,
    previewImage, organizationId, t, onCreateSupplier, onCreateArticle, onUploadImage
  ]);

  const handleSaveAndContinue = useCallback(async () => {
    const success = await handleSave();
    if (!success) return;

    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < voiceArticleQueue.length) {
      setCurrentQueueIndex(nextIndex);
      loadArticleFromQueue(voiceArticleQueue[nextIndex]);
      setStep('article');
    } else {
      setStep('confirm');
    }
  }, [handleSave, currentQueueIndex, voiceArticleQueue, loadArticleFromQueue]);

  const handleFinalSave = useCallback(async () => {
    const success = await handleSave();
    if (success) {
      setStep('confirm');
    }
  }, [handleSave]);

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const canProceedToSupplier = articleName.trim() && articlePrice;
  const canSave = supplierMode === 'existing' ? selectedSupplierId : (newSupplierName.trim() && newSupplierEmail.trim());

  return {
    // Wizard navigation
    step,
    setStep,
    captureMode,
    setCaptureMode,
    resetWizard,
    
    // Loading states
    isAnalyzing,
    isSaving,
    
    // Photo capture
    previewImage,
    setPreviewImage,
    identificationResult,
    setIdentificationResult,
    fileInputRef,
    cameraInputRef,
    handleFileSelect,
    
    // Article form
    articleName,
    setArticleName,
    articleDescription,
    setArticleDescription,
    articleCategory,
    setArticleCategory,
    articleUnit,
    setArticleUnit,
    articlePrice,
    setArticlePrice,
    articleSku,
    setArticleSku,
    
    // Voice capture
    voiceTranscript,
    voiceArticles,
    voiceArticleQueue,
    currentQueueIndex,
    createdArticlesCount,
    handleVoiceResult,
    handleVoiceArticlesConfirm,
    
    // Supplier form
    supplierMode,
    setSupplierMode,
    selectedSupplierId,
    setSelectedSupplierId,
    supplierSearch,
    setSupplierSearch,
    newSupplierName,
    setNewSupplierName,
    newSupplierEmail,
    setNewSupplierEmail,
    newSupplierPhone,
    setNewSupplierPhone,
    newSupplierCustomerNumber,
    setNewSupplierCustomerNumber,
    filteredSuppliers,
    
    // Actions
    handleSave,
    handleSaveAndContinue,
    handleFinalSave,
    
    // Validation
    canProceedToSupplier,
    canSave,
  };
}
