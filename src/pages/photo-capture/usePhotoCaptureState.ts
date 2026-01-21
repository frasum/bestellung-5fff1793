import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CapturedImage } from '@/components/suppliers/BatchPhotoGallery';
import { BatchArticleData } from '@/components/suppliers/ArticleCarousel';
import { Supplier, IdentificationResult, WizardStep, BatchResult } from './types';

export const usePhotoCaptureState = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  // Token verification state
  const [step, setStep] = useState<WizardStep>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  
  // Mode toggle
  const [batchMode, setBatchMode] = useState(false);
  
  // Processing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Single photo state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Single article form state
  const [articleName, setArticleName] = useState('');
  const [articleDescription, setArticleDescription] = useState('');
  const [articleCategory, setArticleCategory] = useState('');
  const [articleUnit, setArticleUnit] = useState('');
  const [articlePrice, setArticlePrice] = useState('');
  const [articleSku, setArticleSku] = useState('');
  
  // Batch state
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [batchArticles, setBatchArticles] = useState<BatchArticleData[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [batchProgress, setBatchProgress] = useState({ total: 0, completed: 0 });
  
  // Supplier state
  const [supplierMode, setSupplierMode] = useState<'existing' | 'new'>('existing');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierCustomerNumber, setNewSupplierCustomerNumber] = useState('');

  // Batch result state
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrorMessage(t('quickCapture.noToken', 'Kein Token angegeben'));
        setStep('error');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-photo-capture-token', {
          body: { token },
        });

        if (error || !data?.success) {
          setErrorMessage(data?.error || t('quickCapture.invalidToken', 'Ungültiger oder abgelaufener Token'));
          setStep('error');
          return;
        }

        setOrganizationId(data.organization_id);
        setOrganizationName(data.organization_name);
        setSuppliers(data.suppliers || []);
        setCategories(data.categories || []);
        setUnits(data.units || []);
        setStep('photo');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
        console.error('Token verification error:', message);
        setErrorMessage(t('quickCapture.verificationError', 'Fehler bei der Token-Überprüfung'));
        setStep('error');
      }
    };

    verifyToken();
  }, [token, t]);

  const resetForm = () => {
    setPreviewImage(null);
    setIdentificationResult(null);
    setArticleName('');
    setArticleDescription('');
    setArticleCategory('');
    setArticleUnit('');
    setArticlePrice('');
    setArticleSku('');
    setCapturedImages([]);
    setBatchArticles([]);
    setCurrentBatchIndex(0);
    setBatchProgress({ total: 0, completed: 0 });
    setBatchResult(null);
    setSupplierMode('existing');
    setSelectedSupplierId('');
    setSupplierSearch('');
    setNewSupplierName('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierCustomerNumber('');
  };

  // Single image processing
  const processImage = async (file: File) => {
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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    e.target.value = '';
  };

  // Batch processing
  const handleAddBatchImage = (image: CapturedImage) => {
    setCapturedImages(prev => [...prev, image]);
  };

  const handleRemoveBatchImage = (id: string) => {
    setCapturedImages(prev => prev.filter(img => img.id !== id));
  };

  const processBatchImages = async () => {
    if (capturedImages.length === 0) return;
    
    setStep('batch-processing');
    setBatchProgress({ total: capturedImages.length, completed: 0 });

    const processPromises = capturedImages.map(async (img) => {
      try {
        const { data, error } = await supabase.functions.invoke('identify-article', {
          body: { imageBase64: img.base64, organizationId },
        });

        const result = error ? null : (data as IdentificationResult);
        
        return {
          imageId: img.id,
          imageBase64: img.base64,
          name: result?.suggested_name || '',
          description: result?.suggested_description || '',
          category: result?.suggested_category || '',
          unit: result?.suggested_unit || 'Stk',
          price: '',
          sku: '',
          confidence: result?.confidence || 'low' as const,
          skipped: false,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
        console.error('Batch processing error for image:', img.id, message);
        return {
          imageId: img.id,
          imageBase64: img.base64,
          name: '',
          description: '',
          category: '',
          unit: 'Stk',
          price: '',
          sku: '',
          confidence: 'low' as const,
          skipped: false,
        };
      } finally {
        setBatchProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
      }
    });

    const processedResults = await Promise.all(processPromises);
    setBatchArticles(processedResults);
    setCurrentBatchIndex(0);
    setStep('batch-review');
    
    toast.success(t('batchCapture.processingComplete', '{{count}} Artikel analysiert', { count: processedResults.length }));
  };

  const handleBatchArticleChange = (index: number, data: Partial<BatchArticleData>) => {
    setBatchArticles(prev => prev.map((article, i) => 
      i === index ? { ...article, ...data } : article
    ));
  };

  const handleSkipArticle = (index: number) => {
    setBatchArticles(prev => prev.map((article, i) => 
      i === index ? { ...article, skipped: true } : article
    ));
  };

  // Single article save
  const handleSaveSingle = async () => {
    if (!articleName.trim() || !articlePrice) {
      toast.error(t('quickCapture.fillRequired', 'Bitte alle Pflichtfelder ausfüllen'));
      return;
    }

    setIsSaving(true);

    try {
      const articleData = {
        name: articleName.trim(),
        description: articleDescription.trim() || null,
        category: articleCategory || null,
        unit: articleUnit || 'Stk',
        price: articlePrice.replace(',', '.'),
        sku: articleSku.trim() || null,
        supplier_id: supplierMode === 'existing' ? selectedSupplierId : null,
      };

      const newSupplierData = supplierMode === 'new' ? {
        name: newSupplierName.trim(),
        email: newSupplierEmail.trim(),
        phone: newSupplierPhone.trim() || null,
        customer_number: newSupplierCustomerNumber.trim() || null,
      } : null;

      if (supplierMode === 'new' && (!newSupplierName.trim() || !newSupplierEmail.trim())) {
        toast.error(t('quickCapture.supplierRequired', 'Lieferanten-Name und E-Mail sind erforderlich'));
        setIsSaving(false);
        return;
      }

      if (supplierMode === 'existing' && !selectedSupplierId) {
        toast.error(t('quickCapture.selectSupplier', 'Bitte einen Lieferanten auswählen'));
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-article-from-mobile', {
        body: { token, article: articleData, imageBase64: previewImage, newSupplier: newSupplierData },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create article');
      }

      if (newSupplierData && data.supplier_id) {
        setSuppliers(prev => [...prev, {
          id: data.supplier_id,
          name: newSupplierData.name,
          email: newSupplierData.email,
          customer_number: newSupplierData.customer_number || undefined,
        }]);
      }

      toast.success(t('quickCapture.articleCreated', 'Artikel "{{name}}" erfolgreich erstellt!', { name: articleName }));
      setStep('confirm');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Save error:', message);
      toast.error(t('quickCapture.saveError', 'Fehler beim Speichern'));
    } finally {
      setIsSaving(false);
    }
  };

  // Batch save
  const handleSaveBatch = async () => {
    const articlesToSave = batchArticles.filter(a => !a.skipped && a.name.trim() && a.price);
    
    if (articlesToSave.length === 0) {
      toast.error(t('batchCapture.noArticlesToSave', 'Keine Artikel zum Speichern'));
      return;
    }

    if (supplierMode === 'new' && (!newSupplierName.trim() || !newSupplierEmail.trim())) {
      toast.error(t('quickCapture.supplierRequired', 'Lieferanten-Name und E-Mail sind erforderlich'));
      return;
    }

    if (supplierMode === 'existing' && !selectedSupplierId) {
      toast.error(t('quickCapture.selectSupplier', 'Bitte einen Lieferanten auswählen'));
      return;
    }

    setIsSaving(true);

    try {
      const newSupplierData = supplierMode === 'new' ? {
        name: newSupplierName.trim(),
        email: newSupplierEmail.trim(),
        phone: newSupplierPhone.trim() || null,
        customer_number: newSupplierCustomerNumber.trim() || null,
      } : null;

      const { data, error } = await supabase.functions.invoke('create-articles-batch', {
        body: {
          token,
          articles: articlesToSave.map(a => ({
            imageBase64: a.imageBase64,
            name: a.name.trim(),
            description: a.description.trim() || null,
            category: a.category || null,
            unit: a.unit || 'Stk',
            price: a.price.replace(',', '.'),
            sku: a.sku.trim() || null,
          })),
          supplierId: supplierMode === 'existing' ? selectedSupplierId : null,
          newSupplier: newSupplierData,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create articles');
      }

      if (newSupplierData && data.supplierId) {
        setSuppliers(prev => [...prev, {
          id: data.supplierId,
          name: newSupplierData.name,
          email: newSupplierData.email,
          customer_number: newSupplierData.customer_number || undefined,
        }]);
      }

      setBatchResult({ successCount: data.successCount, failCount: data.failCount });
      setStep('confirm');
      
      toast.success(t('batchCapture.batchSaved', '{{count}} Artikel erfolgreich erstellt!', { count: data.successCount }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      console.error('Batch save error:', message);
      toast.error(t('quickCapture.saveError', 'Fehler beim Speichern'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const canProceedToSupplier = batchMode 
    ? batchArticles.some(a => !a.skipped && a.name.trim() && a.price)
    : (articleName.trim() && articlePrice);
    
  const canSave = supplierMode === 'existing' ? selectedSupplierId : (newSupplierName.trim() && newSupplierEmail.trim());

  const getSteps = () => {
    if (batchMode) {
      return ['batch-photos', 'batch-review', 'supplier', 'confirm'];
    }
    return ['photo', 'article', 'supplier', 'confirm'];
  };

  return {
    // Token & org
    token,
    step,
    setStep,
    errorMessage,
    organizationId,
    organizationName,
    suppliers,
    categories,
    units,
    
    // Mode
    batchMode,
    setBatchMode,
    
    // Processing
    isAnalyzing,
    isSaving,
    
    // Single photo
    previewImage,
    setPreviewImage,
    identificationResult,
    setIdentificationResult,
    fileInputRef,
    cameraInputRef,
    handleFileSelect,
    
    // Single article form
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
    
    // Batch
    capturedImages,
    setCapturedImages,
    batchArticles,
    currentBatchIndex,
    setCurrentBatchIndex,
    batchProgress,
    handleAddBatchImage,
    handleRemoveBatchImage,
    processBatchImages,
    handleBatchArticleChange,
    handleSkipArticle,
    
    // Supplier
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
    resetForm,
    handleSaveSingle,
    handleSaveBatch,
    canProceedToSupplier,
    canSave,
    getSteps,
  };
};
