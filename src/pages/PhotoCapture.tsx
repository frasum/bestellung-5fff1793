import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Loader2, X, Sparkles, Check, ChevronRight, ChevronLeft, Plus, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  email: string;
  customer_number?: string;
}

interface IdentificationResult {
  matched_article_id: string | null;
  matched_article_name: string | null;
  confidence: 'high' | 'medium' | 'low';
  suggested_name: string;
  suggested_description: string;
  suggested_category: string;
  suggested_unit: string;
}

type WizardStep = 'loading' | 'error' | 'photo' | 'article' | 'supplier' | 'confirm';

const PhotoCapture = () => {
  const { t, i18n } = useTranslation();
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
  
  // Processing state
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
  
  // Supplier state
  const [supplierMode, setSupplierMode] = useState<'existing' | 'new'>('existing');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierCustomerNumber, setNewSupplierCustomerNumber] = useState('');

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
      } catch (err) {
        console.error('Token verification error:', err);
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
    setSupplierMode('existing');
    setSelectedSupplierId('');
    setSupplierSearch('');
    setNewSupplierName('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierCustomerNumber('');
  };

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
        body: {
          imageBase64: base64,
          organizationId,
        },
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
    } catch (err) {
      console.error('Processing error:', err);
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

  const handleSave = async () => {
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
        body: {
          token,
          article: articleData,
          imageBase64: previewImage,
          newSupplier: newSupplierData,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to create article');
      }

      // If new supplier was created, add it to the list
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
    } catch (err) {
      console.error('Save error:', err);
      toast.error(t('quickCapture.saveError', 'Fehler beim Speichern'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(supplierSearch.toLowerCase())
  );

  const canProceedToSupplier = articleName.trim() && articlePrice;
  const canSave = supplierMode === 'existing' ? selectedSupplierId : (newSupplierName.trim() && newSupplierEmail.trim());

  const steps = ['photo', 'article', 'supplier', 'confirm'];
  const currentStepIndex = steps.indexOf(step);

  // Loading state
  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t('common.loading', 'Laden...')}</p>
      </div>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold mb-2">{t('quickCapture.tokenError', 'Fehler')}</h1>
        <p className="text-muted-foreground text-center">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card p-4">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold">{t('quickCapture.title', 'Schnell-Erfassung')}</h1>
            <p className="text-xs text-muted-foreground">{organizationName}</p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i < currentStepIndex ? 'bg-primary text-primary-foreground' :
                  i === currentStepIndex ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' :
                  'bg-muted text-muted-foreground'
                )}>
                  {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'w-8 sm:w-12 h-0.5 mx-1',
                    i < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )} />
              )}
            </div>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-safe overflow-y-auto">
        {/* Step 1: Photo */}
        {step === 'photo' && (
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
                    onClick={() => { setPreviewImage(null); setIdentificationResult(null); }}
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
        )}

        {/* Step 2: Article Details */}
        {step === 'article' && (
          <div className="space-y-4">
            {previewImage && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img src={previewImage} alt="Preview" className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{t('quickCapture.aiSuggestion', 'KI-Vorschlag')}</span>
                  </div>
                  {identificationResult && (
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      identificationResult.confidence === 'high' ? 'bg-green-500/20 text-green-600' :
                      identificationResult.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                      'bg-red-500/20 text-red-600'
                    )}>
                      {identificationResult.confidence === 'high' ? t('quickCapture.highConfidence', 'Hohe Sicherheit') :
                       identificationResult.confidence === 'medium' ? t('quickCapture.mediumConfidence', 'Mittlere Sicherheit') :
                       t('quickCapture.lowConfidence', 'Niedrige Sicherheit')}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="articleName">{t('quickCapture.articleName', 'Artikelname')} *</Label>
                <Input
                  id="articleName"
                  value={articleName}
                  onChange={(e) => setArticleName(e.target.value)}
                  placeholder={t('quickCapture.articleNamePlaceholder', 'z.B. San Marzano Tomaten')}
                  className="h-12"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('quickCapture.category', 'Kategorie')}</Label>
                  <Select value={articleCategory} onValueChange={setArticleCategory}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t('quickCapture.selectCategory', 'Wählen...')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('quickCapture.unit', 'Einheit')}</Label>
                  <Select value={articleUnit} onValueChange={setArticleUnit}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t('quickCapture.selectUnit', 'Wählen...')} />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="articlePrice">{t('quickCapture.price', 'Preis (€)')} *</Label>
                  <Input
                    id="articlePrice"
                    type="text"
                    inputMode="decimal"
                    value={articlePrice}
                    onChange={(e) => setArticlePrice(e.target.value)}
                    placeholder="0,00"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="articleSku">{t('quickCapture.sku', 'Artikelnummer')}</Label>
                  <Input
                    id="articleSku"
                    value={articleSku}
                    onChange={(e) => setArticleSku(e.target.value)}
                    placeholder={t('quickCapture.skuPlaceholder', 'Optional')}
                    className="h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="articleDescription">{t('quickCapture.description', 'Beschreibung')}</Label>
                <Textarea
                  id="articleDescription"
                  value={articleDescription}
                  onChange={(e) => setArticleDescription(e.target.value)}
                  placeholder={t('quickCapture.descriptionPlaceholder', 'Optionale Beschreibung...')}
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="lg" onClick={() => setStep('photo')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.back', 'Zurück')}
              </Button>
              <Button size="lg" onClick={() => setStep('supplier')} disabled={!canProceedToSupplier}>
                {t('common.next', 'Weiter')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Supplier */}
        {step === 'supplier' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('quickCapture.supplierQuestion', 'Von welchem Lieferanten beziehst du diesen Artikel?')}
            </p>

            <RadioGroup value={supplierMode} onValueChange={(v) => setSupplierMode(v as 'existing' | 'new')}>
              <div className="space-y-3">
                <div className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                  supplierMode === 'existing' ? 'border-primary bg-primary/5' : 'border-border'
                )}>
                  <RadioGroupItem value="existing" id="existing" className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="existing" className="font-medium cursor-pointer">
                      {t('quickCapture.existingSupplier', 'Bestehender Lieferant')}
                    </Label>
                    {supplierMode === 'existing' && (
                      <div className="space-y-2">
                        <Input
                          placeholder={t('quickCapture.searchSupplier', 'Lieferant suchen...')}
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="h-12"
                        />
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {filteredSuppliers.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-2">
                              {suppliers.length === 0 
                                ? t('quickCapture.noSuppliers', 'Noch keine Lieferanten vorhanden')
                                : t('quickCapture.noSuppliersFound', 'Keine Lieferanten gefunden')}
                            </p>
                          ) : (
                            filteredSuppliers.map(supplier => (
                              <div
                                key={supplier.id}
                                className={cn(
                                  'flex items-center gap-2 p-3 rounded cursor-pointer transition-colors min-h-[52px]',
                                  selectedSupplierId === supplier.id 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'hover:bg-muted'
                                )}
                                onClick={() => setSelectedSupplierId(supplier.id)}
                              >
                                <Building2 className="h-5 w-5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{supplier.name}</p>
                                  <p className={cn(
                                    'text-xs truncate',
                                    selectedSupplierId === supplier.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  )}>{supplier.email}</p>
                                </div>
                                {selectedSupplierId === supplier.id && (
                                  <Check className="h-5 w-5 shrink-0" />
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn(
                  'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                  supplierMode === 'new' ? 'border-primary bg-primary/5' : 'border-border'
                )}>
                  <RadioGroupItem value="new" id="new" className="mt-1" />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="new" className="font-medium cursor-pointer flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      {t('quickCapture.newSupplier', 'Neuen Lieferanten erstellen')}
                    </Label>
                    {supplierMode === 'new' && (
                      <div className="grid gap-3 pt-2">
                        <div className="space-y-1">
                          <Label className="text-xs">{t('quickCapture.companyName', 'Firmenname')} *</Label>
                          <Input
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                            placeholder={t('quickCapture.companyNamePlaceholder', 'z.B. Metro Cash & Carry')}
                            className="h-12"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('quickCapture.orderEmail', 'E-Mail für Bestellungen')} *</Label>
                          <Input
                            type="email"
                            value={newSupplierEmail}
                            onChange={(e) => setNewSupplierEmail(e.target.value)}
                            placeholder="bestellung@lieferant.de"
                            className="h-12"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">{t('quickCapture.customerNumber', 'Ihre Kundennummer')}</Label>
                            <Input
                              value={newSupplierCustomerNumber}
                              onChange={(e) => setNewSupplierCustomerNumber(e.target.value)}
                              placeholder={t('quickCapture.customerNumberPlaceholder', 'z.B. K-12345')}
                              className="h-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('quickCapture.phone', 'Telefon')}</Label>
                            <Input
                              value={newSupplierPhone}
                              onChange={(e) => setNewSupplierPhone(e.target.value)}
                              placeholder={t('quickCapture.phonePlaceholder', 'Optional')}
                              className="h-12"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="lg" onClick={() => setStep('article')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.back', 'Zurück')}
              </Button>
              <Button size="lg" onClick={handleSave} disabled={!canSave || isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('common.saving', 'Speichern...')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t('quickCapture.saveArticle', 'Artikel speichern')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-6 py-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{t('quickCapture.successTitle', 'Artikel erfolgreich erstellt!')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('quickCapture.successDescription', '"{{name}}" wurde zu deinem Katalog hinzugefügt.', { name: articleName })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button size="lg" className="h-14" onClick={() => { resetForm(); setStep('photo'); }}>
                <Camera className="h-5 w-5 mr-2" />
                {t('quickCapture.captureNext', 'Nächsten Artikel erfassen')}
              </Button>
              <Button variant="outline" size="lg" className="h-14" onClick={() => window.close()}>
                {t('common.done', 'Fertig')}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PhotoCapture;
