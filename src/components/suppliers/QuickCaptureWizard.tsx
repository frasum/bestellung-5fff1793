import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Loader2, X, Sparkles, Check, ChevronRight, ChevronLeft, Plus, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { ArticleInput } from '@/hooks/useArticles';

interface IdentificationResult {
  matched_article_id: string | null;
  matched_article_name: string | null;
  confidence: 'high' | 'medium' | 'low';
  suggested_name: string;
  suggested_description: string;
  suggested_category: string;
  suggested_unit: string;
}

interface QuickCaptureWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  onCreateSupplier: (input: SupplierInput) => Promise<Supplier>;
  onCreateArticle: (input: ArticleInput) => Promise<any>;
  onUploadImage: (base64: string, orgId: string, articleId: string) => Promise<string | null>;
  organizationId: string | null;
}

type WizardStep = 'photo' | 'article' | 'supplier' | 'confirm';

export const QuickCaptureWizard = ({
  open,
  onOpenChange,
  suppliers,
  categories,
  units,
  onCreateSupplier,
  onCreateArticle,
  onUploadImage,
  organizationId,
}: QuickCaptureWizardProps) => {
  const { t } = useTranslation();
  
  // Wizard state
  const [step, setStep] = useState<WizardStep>('photo');
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

  const resetWizard = () => {
    setStep('photo');
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

  const handleClose = () => {
    resetWizard();
    onOpenChange(false);
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
      
      // Pre-fill article form
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
      let supplierId = selectedSupplierId;

      // Create new supplier if needed
      if (supplierMode === 'new') {
        if (!newSupplierName.trim() || !newSupplierEmail.trim()) {
          toast.error(t('quickCapture.supplierRequired', 'Lieferanten-Name und E-Mail sind erforderlich'));
          setIsSaving(false);
          return;
        }

        const newSupplier = await onCreateSupplier({
          name: newSupplierName.trim(),
          email: newSupplierEmail.trim(),
          phone: newSupplierPhone.trim() || undefined,
          customer_number: newSupplierCustomerNumber.trim() || undefined,
        });
        supplierId = newSupplier.id;
        toast.success(t('quickCapture.supplierCreated', 'Lieferant "{{name}}" erstellt', { name: newSupplierName }));
      }

      if (!supplierId) {
        toast.error(t('quickCapture.selectSupplier', 'Bitte einen Lieferanten auswählen'));
        setIsSaving(false);
        return;
      }

      // Create article
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

      // Upload image if available
      if (previewImage && previewImage.startsWith('data:') && newArticle && organizationId) {
        const imageUrl = await onUploadImage(previewImage, organizationId, newArticle.id);
        if (imageUrl) {
          // Update article with image URL - this is handled by the parent
        }
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

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'photo', label: t('quickCapture.stepPhoto', 'Foto') },
    { key: 'article', label: t('quickCapture.stepArticle', 'Artikel') },
    { key: 'supplier', label: t('quickCapture.stepSupplier', 'Lieferant') },
    { key: 'confirm', label: t('quickCapture.stepConfirm', 'Fertig') },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const canProceedToSupplier = articleName.trim() && articlePrice;
  const canSave = supplierMode === 'existing' ? selectedSupplierId : (newSupplierName.trim() && newSupplierEmail.trim());

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {t('quickCapture.title', 'Schnell-Erfassung')}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
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

        {/* Step 1: Photo */}
        {step === 'photo' && (
          <div className="space-y-4">
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
                    onClick={() => { setPreviewImage(null); setIdentificationResult(null); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
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
                      className="h-14 px-6"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={isAnalyzing}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      {t('quickCapture.takePhoto', 'Foto aufnehmen')}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 px-6"
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
            {/* Image preview mini */}
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
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t('quickCapture.category', 'Kategorie')}</Label>
                  <Select value={articleCategory} onValueChange={setArticleCategory}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="articleSku">{t('quickCapture.sku', 'Artikelnummer')}</Label>
                  <Input
                    id="articleSku"
                    value={articleSku}
                    onChange={(e) => setArticleSku(e.target.value)}
                    placeholder={t('quickCapture.skuPlaceholder', 'Optional')}
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
              <Button variant="ghost" onClick={() => setStep('photo')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.back', 'Zurück')}
              </Button>
              <Button onClick={() => setStep('supplier')} disabled={!canProceedToSupplier}>
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
                        />
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {filteredSuppliers.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-2">
                              {suppliers.length === 0 
                                ? t('quickCapture.noSuppliers', 'Noch keine Lieferanten vorhanden')
                                : t('quickCapture.noSuppliersFound', 'Keine Lieferanten gefunden')}
                            </p>
                          ) : (
                            filteredSuppliers.slice(0, 5).map(supplier => (
                              <div
                                key={supplier.id}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                                  selectedSupplierId === supplier.id 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'hover:bg-muted'
                                )}
                                onClick={() => setSelectedSupplierId(supplier.id)}
                              >
                                <Building2 className="h-4 w-4 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{supplier.name}</p>
                                  <p className={cn(
                                    'text-xs truncate',
                                    selectedSupplierId === supplier.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  )}>{supplier.email}</p>
                                </div>
                                {selectedSupplierId === supplier.id && (
                                  <Check className="h-4 w-4 shrink-0" />
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
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">{t('quickCapture.orderEmail', 'E-Mail für Bestellungen')} *</Label>
                          <Input
                            type="email"
                            value={newSupplierEmail}
                            onChange={(e) => setNewSupplierEmail(e.target.value)}
                            placeholder="bestellung@lieferant.de"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">{t('quickCapture.customerNumber', 'Ihre Kundennummer')}</Label>
                            <Input
                              value={newSupplierCustomerNumber}
                              onChange={(e) => setNewSupplierCustomerNumber(e.target.value)}
                              placeholder={t('quickCapture.customerNumberPlaceholder', 'z.B. K-12345')}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('quickCapture.phone', 'Telefon')}</Label>
                            <Input
                              value={newSupplierPhone}
                              onChange={(e) => setNewSupplierPhone(e.target.value)}
                              placeholder={t('quickCapture.phonePlaceholder', 'Optional')}
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
              <Button variant="ghost" onClick={() => setStep('article')}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('common.back', 'Zurück')}
              </Button>
              <Button onClick={handleSave} disabled={!canSave || isSaving}>
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
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{t('quickCapture.successTitle', 'Artikel erfolgreich erstellt!')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('quickCapture.successDescription', '"{{name}}" wurde zu deinem Katalog hinzugefügt.', { name: articleName })}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={() => { resetWizard(); setStep('photo'); }} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                {t('quickCapture.captureNext', 'Nächsten Artikel erfassen')}
              </Button>
              <Button variant="outline" onClick={handleClose} className="w-full">
                {t('common.done', 'Fertig')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
