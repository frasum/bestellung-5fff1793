import { useEffect, useState, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, ChevronsUpDown, Loader2, Plus, Package, Save, Globe, ChevronDown, Sparkles, Trash2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Article } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { articleSchema, ArticleFormData } from './schemas';
import { useOrderUnits, useCreateOrderUnit } from '@/hooks/useOrderUnits';
import { ArticlePhotoCapture } from './ArticlePhotoCapture';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLocations } from '@/hooks/useLocations';
import { useArticleLocations, useUpdateArticleLocations } from '@/hooks/useArticleLocations';

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingArticle: Article | null;
  preselectedSupplierId?: string | null;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  onSubmit: (data: ArticleFormData, capturedImage?: string, imageCleared?: boolean) => Promise<void>;
  isPending: boolean;
  onDelete?: (article: Article) => void;
}

export const ArticleFormDialog = ({
  open,
  onOpenChange,
  editingArticle,
  preselectedSupplierId,
  suppliers,
  categories,
  units,
  onSubmit,
  isPending,
  onDelete
}: ArticleFormDialogProps) => {
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [orderUnitPopoverOpen, setOrderUnitPopoverOpen] = useState(false);
  const [customOrderQuantity, setCustomOrderQuantity] = useState('');
  const [customOrderName, setCustomOrderName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageCleared, setImageCleared] = useState(false);
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [translationsOpen, setTranslationsOpen] = useState(false);
  const [isTranslatingEn, setIsTranslatingEn] = useState(false);
  const [isTranslatingTh, setIsTranslatingTh] = useState(false);
  const [isTranslatingFr, setIsTranslatingFr] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  
  const { data: orderUnits = [] } = useOrderUnits();
  const createOrderUnit = useCreateOrderUnit();
  const { data: locations = [] } = useLocations();
  const { data: articleLocations = [] } = useArticleLocations(editingArticle?.id);
  const updateArticleLocations = useUpdateArticleLocations();
  const isMobile = useIsMobile();

  // Fetch organization ID
  useEffect(() => {
    const fetchOrgId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();
        if (profile) {
          setOrganizationId(profile.organization_id);
        }
      }
    };
    fetchOrgId();
  }, []);

  // Refs for auto-growing textareas
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const grapeVarietyRef = useRef<HTMLTextAreaElement>(null);
  const flavorProfileRef = useRef<HTMLTextAreaElement>(null);
  const foodPairingsRef = useRef<HTMLTextAreaElement>(null);

  // Check for advanced settings
  useEffect(() => {
    const stored = localStorage.getItem('advanced-settings-enabled');
    setAdvancedSettingsEnabled(stored === 'true');
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedSettingsEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-resize textareas when form data changes (initial load)
  useEffect(() => {
    const adjustHeight = (textarea: HTMLTextAreaElement | null, minHeight: number) => {
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
      }
    };
    
    // Small delay to ensure form values are populated
    const timeoutId = setTimeout(() => {
      adjustHeight(descriptionRef.current, 80);
      adjustHeight(grapeVarietyRef.current, 60);
      adjustHeight(flavorProfileRef.current, 60);
      adjustHeight(foodPairingsRef.current, 60);
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [open, editingArticle]);

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { 
      supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '', 
      origin_country: '', packaging_unit: '', order_unit_id: '', reference_price: '', reference_unit: '', 
      selling_price: '', grape_variety: '', flavor_profile: '', food_pairings: '',
      description_en: '', grape_variety_en: '', flavor_profile_en: '', food_pairings_en: '', origin_country_en: '',
      description_th: '', grape_variety_th: '', flavor_profile_th: '', food_pairings_th: '', origin_country_th: '',
      description_fr: '', grape_variety_fr: '', flavor_profile_fr: '', food_pairings_fr: '', origin_country_fr: '',
    },
  });

  // Watch category to conditionally show origin_country field
  const watchedCategory = form.watch('category');

  useEffect(() => {
    if (editingArticle) {
      form.reset({
        supplier_id: editingArticle.supplier_id,
        name: editingArticle.name,
        description: editingArticle.description || '',
        sku: editingArticle.sku || '',
        unit: editingArticle.unit,
        price: String(editingArticle.price),
        category: editingArticle.category || '',
        origin_country: (editingArticle as any).origin_country || '',
        packaging_unit: editingArticle.packaging_unit ? String(editingArticle.packaging_unit) : '',
        order_unit_id: editingArticle.order_unit_id || '',
        reference_price: editingArticle.reference_price ? String(editingArticle.reference_price).replace('.', ',') : '',
        reference_unit: editingArticle.reference_unit || '',
        selling_price: (editingArticle as any).selling_price ? String((editingArticle as any).selling_price) : '',
        grape_variety: (editingArticle as any).grape_variety || '',
        flavor_profile: (editingArticle as any).flavor_profile || '',
        food_pairings: (editingArticle as any).food_pairings || '',
        // Translation fields
        description_en: (editingArticle as any).description_en || '',
        grape_variety_en: (editingArticle as any).grape_variety_en || '',
        flavor_profile_en: (editingArticle as any).flavor_profile_en || '',
        food_pairings_en: (editingArticle as any).food_pairings_en || '',
        origin_country_en: (editingArticle as any).origin_country_en || '',
        description_th: (editingArticle as any).description_th || '',
        grape_variety_th: (editingArticle as any).grape_variety_th || '',
        flavor_profile_th: (editingArticle as any).flavor_profile_th || '',
        food_pairings_th: (editingArticle as any).food_pairings_th || '',
        origin_country_th: (editingArticle as any).origin_country_th || '',
        description_fr: (editingArticle as any).description_fr || '',
        grape_variety_fr: (editingArticle as any).grape_variety_fr || '',
        flavor_profile_fr: (editingArticle as any).flavor_profile_fr || '',
        food_pairings_fr: (editingArticle as any).food_pairings_fr || '',
        origin_country_fr: (editingArticle as any).origin_country_fr || '',
      });
      setCapturedImage((editingArticle as any).image_url || null);
    } else {
      form.reset({ 
        supplier_id: preselectedSupplierId || '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '', 
        origin_country: '', packaging_unit: '', order_unit_id: '', reference_price: '', reference_unit: '', 
        selling_price: '', grape_variety: '', flavor_profile: '', food_pairings: '',
        description_en: '', grape_variety_en: '', flavor_profile_en: '', food_pairings_en: '', origin_country_en: '',
        description_th: '', grape_variety_th: '', flavor_profile_th: '', food_pairings_th: '', origin_country_th: '',
        description_fr: '', grape_variety_fr: '', flavor_profile_fr: '', food_pairings_fr: '', origin_country_fr: '',
      });
      setCapturedImage(null);
    }
    setImageCleared(false);
    setTranslationsOpen(false);
  }, [editingArticle, preselectedSupplierId, form]);

  // Initialize selected locations when editing or for new articles
  useEffect(() => {
    if (editingArticle && articleLocations.length > 0) {
      // When editing, use existing article locations
      setSelectedLocationIds(articleLocations.filter(al => al.is_active).map(al => al.location_id));
    } else if (!editingArticle && locations.length > 0) {
      // For new articles, select all locations by default
      setSelectedLocationIds(locations.map(l => l.id));
    }
  }, [editingArticle, articleLocations, locations]);

  const handleSubmit = async (data: ArticleFormData) => {
    await onSubmit(data, capturedImage || undefined, imageCleared);
    
    // Update article locations if editing and there are multiple locations
    if (editingArticle && locations.length > 1) {
      try {
        await updateArticleLocations.mutateAsync({
          articleId: editingArticle.id,
          locationIds: selectedLocationIds,
        });
      } catch (error) {
        console.error('Failed to update article locations:', error);
      }
    }
    
    form.reset();
    setCapturedImage(null);
    setImageCleared(false);
  };

  const handleImageCaptured = (base64Image: string, result: {
    matched_article_id: string | null;
    matched_article_name: string | null;
    confidence: 'high' | 'medium' | 'low';
    suggested_name: string;
    suggested_description: string;
    suggested_category: string;
    suggested_unit: string;
  }) => {
    setCapturedImage(base64Image);
    
    // Auto-fill form fields with AI suggestions (only for new articles or if fields are empty)
    if (!editingArticle) {
      if (result.suggested_name && !form.getValues('name')) {
        form.setValue('name', result.suggested_name);
      }
      if (result.suggested_description && !form.getValues('description')) {
        form.setValue('description', result.suggested_description);
      }
      if (result.suggested_category && !form.getValues('category')) {
        // Check if category exists in the list
        if (categories.includes(result.suggested_category)) {
          form.setValue('category', result.suggested_category);
        }
      }
      if (result.suggested_unit && !form.getValues('unit')) {
        form.setValue('unit', result.suggested_unit);
      }
    }
  };

  // Check if it's a wine category for dynamic dialog width
  const isWineCategory = watchedCategory?.toLowerCase().includes('wein');

  // Check if translations exist
  const hasEnglishTranslations = !!(form.watch('description_en') || form.watch('grape_variety_en') || 
    form.watch('flavor_profile_en') || form.watch('food_pairings_en'));
  const hasThaiTranslations = !!(form.watch('description_th') || form.watch('grape_variety_th') || 
    form.watch('flavor_profile_th') || form.watch('food_pairings_th'));
  const hasFrenchTranslations = !!(form.watch('description_fr') || form.watch('grape_variety_fr') || 
    form.watch('flavor_profile_fr') || form.watch('food_pairings_fr'));
  const hasAnyTranslations = hasEnglishTranslations || hasThaiTranslations || hasFrenchTranslations;

  // Auto-translate function
  const handleAutoTranslate = async (targetLanguage: 'en' | 'th' | 'fr') => {
    if (!editingArticle?.id) {
      toast.error('Bitte speichern Sie den Artikel zuerst, bevor Sie übersetzen');
      return;
    }

    const setIsTranslating = targetLanguage === 'en' ? setIsTranslatingEn : targetLanguage === 'th' ? setIsTranslatingTh : setIsTranslatingFr;
    setIsTranslating(true);

    try {
      const { data, error } = await supabase.functions.invoke('translate-wine-content', {
        body: { articleId: editingArticle.id, targetLanguage },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.translations) {
        const translations = data.translations;
        const suffix = `_${targetLanguage}` as const;
        
        if (translations.description) form.setValue(`description${suffix}` as any, translations.description);
        if (translations.grape_variety) form.setValue(`grape_variety${suffix}` as any, translations.grape_variety);
        if (translations.flavor_profile) form.setValue(`flavor_profile${suffix}` as any, translations.flavor_profile);
        if (translations.food_pairings) form.setValue(`food_pairings${suffix}` as any, translations.food_pairings);
        if (translations.origin_country) form.setValue(`origin_country${suffix}` as any, translations.origin_country);
        
        const langNames = { en: 'Englische', th: 'Thailändische', fr: 'Französische' };
        toast.success(`${langNames[targetLanguage]} Übersetzung erstellt`);
      }
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Fehler bei der Übersetzung');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto",
        isWineCategory ? "sm:max-w-2xl" : "sm:max-w-md"
      )}>
        <DialogHeader>
          <DialogTitle>
            {editingArticle 
              ? `${suppliers?.find(s => s.id === editingArticle.supplier_id)?.name || ''} - Artikel bearbeiten`
              : 'Neuer Artikel'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* AI Photo Capture - only in advanced mode AND on mobile */}
          {advancedSettingsEnabled && isMobile && (
            <ArticlePhotoCapture
              supplierId={form.watch('supplier_id') || null}
              organizationId={organizationId}
              existingImageUrl={(editingArticle as any)?.image_url}
              onImageCaptured={handleImageCaptured}
              onImageCleared={() => {
                setCapturedImage(null);
                setImageCleared(true);
              }}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          )}
          
          {/* === BASISDATEN === */}
          {/* Lieferant-Auswahl nur bei neuen Artikeln ohne preselectedSupplierId */}
          {!editingArticle && !preselectedSupplierId && (
            <div className="space-y-2">
              <Label>Lieferant *</Label>
              <Controller
                name="supplier_id"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Lieferant auswählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border z-50">
                      {suppliers?.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.supplier_id && (
                <p className="text-sm text-destructive">{form.formState.errors.supplier_id.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="article-name">Name *</Label>
            <Input id="article-name" {...form.register('name')} placeholder="San Marzano Tomatoes" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Einheit *</Label>
              <Controller
                name="unit"
                control={form.control}
                render={({ field }) => (
                  <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={unitPopoverOpen} className="w-full justify-between bg-card">
                        {field.value || "Auswählen"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Einheit suchen..." value={customUnit} onValueChange={setCustomUnit} />
                        <CommandList>
                          <CommandEmpty>
                            {customUnit && (
                              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                                field.onChange(customUnit);
                                setUnitPopoverOpen(false);
                                setCustomUnit('');
                              }}>
                                <Plus className="mr-2 h-4 w-4" />
                                "{customUnit}" hinzufügen
                              </Button>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {units.map((unit) => (
                              <CommandItem key={unit} value={unit} onSelect={() => {
                                field.onChange(unit);
                                setUnitPopoverOpen(false);
                                setCustomUnit('');
                              }}>
                                <Check className={cn("mr-2 h-4 w-4", field.value === unit ? "opacity-100" : "opacity-0")} />
                                {unit}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-price">Preis (€) *</Label>
              <Input id="article-price" type="number" step="0.01" {...form.register('price')} placeholder="4.50" onFocus={(e) => e.target.select()} />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="article-sku">SKU</Label>
              <Input id="article-sku" {...form.register('sku')} placeholder="TOM-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-packaging-unit">Stk. pro BE</Label>
              <Input 
                id="article-packaging-unit" 
                type="number" 
                min="1"
                {...form.register('packaging_unit')} 
                placeholder="z.B. 6" 
                onFocus={(e) => e.target.select()}
              />
              <p className="text-xs text-muted-foreground">
                Wie viele Einheiten pro Bestelleinheit?
              </p>
            </div>
            {/* Berechneter BE-Preis */}
            {(() => {
              const price = parseFloat(form.watch('price') || '0');
              const packagingUnit = parseInt(form.watch('packaging_unit') || '0');
              const orderUnitId = form.watch('order_unit_id');
              const selectedOrderUnit = orderUnits.find(u => u.id === orderUnitId);
              
              // Verwende packaging_unit falls vorhanden, sonst orderUnit.quantity
              const multiplier = packagingUnit > 0 ? packagingUnit : (selectedOrderUnit?.quantity || 1);
              const bePrice = price * multiplier;
              
              if (price > 0 && multiplier > 1) {
                return (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">BE-Preis</Label>
                    <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted/50">
                      <span className="font-semibold text-primary">€{bePrice.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        /{selectedOrderUnit?.name || 'BE'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {multiplier}× €{price.toFixed(2)}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
            <div className="space-y-2">
              <Label>Bestelleinheit</Label>
              <Controller
                name="order_unit_id"
                control={form.control}
                render={({ field }) => {
                  const selectedUnit = orderUnits.find(u => u.id === field.value);
                  return (
                    <Popover open={orderUnitPopoverOpen} onOpenChange={setOrderUnitPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={orderUnitPopoverOpen} className="w-full justify-between bg-card">
                          {selectedUnit ? (
                            <span className="flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-muted-foreground" />
                              {selectedUnit.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Auswählen</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[260px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="BE suchen..." 
                            value={customOrderQuantity}
                            onValueChange={setCustomOrderQuantity}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2 space-y-2">
                                <p className="text-xs text-muted-foreground">Neue BE erstellen:</p>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="1"
                                  placeholder="Menge eingeben..."
                                  className="h-9"
                                  value={customOrderQuantity}
                                  onChange={(e) => setCustomOrderQuantity(e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                                {customOrderQuantity && (
                                  <div className="space-y-2 pt-2 border-t">
                                    <Input
                                      placeholder={`z.B. ${customOrderQuantity}er Kiste`}
                                      className="h-9"
                                      value={customOrderName}
                                      onChange={(e) => setCustomOrderName(e.target.value)}
                                    />
                                    <Button 
                                      size="sm" 
                                      className="w-full h-8"
                                      disabled={!customOrderName || createOrderUnit.isPending}
                                      onClick={() => {
                                        createOrderUnit.mutate({
                                          name: customOrderName,
                                          quantity: parseInt(customOrderQuantity)
                                        }, {
                                          onSuccess: (newUnit) => {
                                            field.onChange(newUnit.id);
                                            setOrderUnitPopoverOpen(false);
                                            setCustomOrderQuantity('');
                                            setCustomOrderName('');
                                          }
                                        });
                                      }}
                                    >
                                      <Save className="mr-2 h-3 w-3" />
                                      BE speichern
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CommandEmpty>
                            <CommandGroup heading="Bestelleinheiten">
                              {orderUnits.map((unit) => (
                                <CommandItem 
                                  key={unit.id} 
                                  value={unit.name}
                                  onSelect={() => {
                                    field.onChange(unit.id);
                                    setOrderUnitPopoverOpen(false);
                                    setCustomOrderQuantity('');
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", field.value === unit.id ? "opacity-100" : "opacity-0")} />
                                  <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <span>{unit.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            {field.value && (
                              <CommandGroup>
                                <CommandItem
                                  value="clear"
                                  onSelect={() => {
                                    field.onChange('');
                                    setOrderUnitPopoverOpen(false);
                                    setCustomOrderQuantity('');
                                  }}
                                  className="text-muted-foreground"
                                >
                                  Keine BE
                                </CommandItem>
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
            </div>
          </div>
          {/* === KATEGORISIERUNG === */}
          <div className={cn("grid gap-4", isWineCategory ? "grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Auswählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border z-50">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            
            {/* Origin Country - only visible for wine categories */}
            {isWineCategory && (
              <div className="space-y-2">
                <Label>Herkunftsland 🌍</Label>
                <Controller
                  name="origin_country"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <SelectTrigger className="bg-card">
                        <SelectValue placeholder="Herkunftsland auswählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border z-50">
                        <SelectItem value="Deutschland">Deutschland</SelectItem>
                        <SelectItem value="Österreich">Österreich</SelectItem>
                        <SelectItem value="Italien">Italien</SelectItem>
                        <SelectItem value="Frankreich">Frankreich</SelectItem>
                        <SelectItem value="Spanien">Spanien</SelectItem>
                        <SelectItem value="Portugal">Portugal</SelectItem>
                        <SelectItem value="RSA">RSA (Südafrika)</SelectItem>
                        <SelectItem value="Neue Welt">Neue Welt</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* === WEIN-DETAILS SEKTION === */}
          {isWineCategory && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                🍷 Wein-Details
              </h3>
              
              {/* Selling Price for Wines */}
              <div className="space-y-2">
                <Label htmlFor="article-selling-price">Verkaufspreis (€)</Label>
                <Input 
                  id="article-selling-price" 
                  type="number"
                  step="0.01"
                  {...form.register('selling_price')} 
                  placeholder="z.B. 42.00"
                  onFocus={(e) => e.target.select()}
                  className={cn(
                    editingArticle && !form.watch('selling_price') && 
                    'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Verkaufspreis im Restaurant (für Mitarbeiter sichtbar)
                </p>
              </div>
              
              {/* Description - full width auto-grow */}
              <div className="space-y-2">
                <Label htmlFor="article-description">Beschreibung</Label>
                <Textarea 
                  ref={descriptionRef}
                  id="article-description" 
                  {...form.register('description')} 
                  placeholder="Weingut, Jahrgang, Qualitätsstufe, besondere Merkmale..."
                  className="min-h-[80px] resize-none"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.max(80, target.scrollHeight)}px`;
                  }}
                />
              </div>

              {/* Grape Variety - auto-grow */}
              <div className="space-y-2">
                <Label htmlFor="article-grape-variety">Traubensorte 🍇</Label>
                <Textarea 
                  ref={grapeVarietyRef}
                  id="article-grape-variety" 
                  {...form.register('grape_variety')} 
                  placeholder="z.B. Riesling, Spätburgunder, Cuvée aus Merlot und Cabernet..."
                  className={cn(
                    "min-h-[60px] resize-none",
                    editingArticle && !form.watch('grape_variety')?.trim() && 
                    'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
                  )}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.max(60, target.scrollHeight)}px`;
                  }}
                />
              </div>

              {/* Flavor Profile - auto-grow */}
              <div className="space-y-2">
                <Label htmlFor="article-flavor-profile">Geschmacksprofil 🍷</Label>
                <Textarea 
                  ref={flavorProfileRef}
                  id="article-flavor-profile" 
                  {...form.register('flavor_profile')} 
                  placeholder="z.B. fruchtig mit Noten von Kirsche und Vanille, samtige Tannine..."
                  className={cn(
                    "min-h-[60px] resize-none",
                    editingArticle && !form.watch('flavor_profile')?.trim() && 
                    'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
                  )}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.max(60, target.scrollHeight)}px`;
                  }}
                />
              </div>

              {/* Food Pairings - auto-grow */}
              <div className="space-y-2">
                <Label htmlFor="article-food-pairings">Speiseempfehlungen 🍽️</Label>
                <Textarea 
                  ref={foodPairingsRef}
                  id="article-food-pairings" 
                  {...form.register('food_pairings')} 
                  placeholder="z.B. Passt hervorragend zu Lamm, gegrilltem Gemüse, reifem Käse..."
                  className={cn(
                    "min-h-[60px] resize-none",
                    editingArticle && !form.watch('food_pairings')?.trim() && 
                    'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
                  )}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.max(60, target.scrollHeight)}px`;
                  }}
                />
              </div>

              {/* === TRANSLATIONS SECTION === */}
              <Collapsible open={translationsOpen} onOpenChange={setTranslationsOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Übersetzungen (EN/TH/FR)</span>
                  <Badge variant={hasAnyTranslations ? "default" : "secondary"} className="ml-auto text-xs">
                    {hasAnyTranslations ? (
                      <>{hasEnglishTranslations && '🇬🇧'}{hasThaiTranslations && '🇹🇭'}{hasFrenchTranslations && '🇫🇷'}</>
                    ) : 'leer'}
                  </Badge>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", translationsOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-3">
                  
                  {/* English Section */}
                  <div className="border-l-2 border-blue-400 pl-3 space-y-3">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-sm font-medium">🇬🇧 English</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAutoTranslate('en')}
                        disabled={isTranslatingEn || !editingArticle}
                        className="h-7 text-xs"
                      >
                        {isTranslatingEn ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        Auto-übersetzen
                      </Button>
                    </div>
                    <Textarea 
                      {...form.register('description_en')} 
                      placeholder="Description..."
                      className="min-h-[50px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('grape_variety_en')} 
                      placeholder="Grape variety..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('flavor_profile_en')} 
                      placeholder="Flavor profile..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('food_pairings_en')} 
                      placeholder="Food pairings..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Input 
                      {...form.register('origin_country_en')} 
                      placeholder="Origin country..."
                      className="text-sm"
                    />
                  </div>
                  
                  {/* Thai Section */}
                  <div className="border-l-2 border-green-400 pl-3 space-y-3">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-sm font-medium">🇹🇭 ไทย</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAutoTranslate('th')}
                        disabled={isTranslatingTh || !editingArticle}
                        className="h-7 text-xs"
                      >
                        {isTranslatingTh ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        Auto-übersetzen
                      </Button>
                    </div>
                    <Textarea 
                      {...form.register('description_th')} 
                      placeholder="คำอธิบาย..."
                      className="min-h-[50px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('grape_variety_th')} 
                      placeholder="พันธุ์องุ่น..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('flavor_profile_th')} 
                      placeholder="รสชาติ..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('food_pairings_th')} 
                      placeholder="อาหารที่เข้ากัน..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Input 
                      {...form.register('origin_country_th')} 
                      placeholder="ประเทศต้นกำเนิด..."
                      className="text-sm"
                    />
                  </div>
                  
                  {/* French Section */}
                  <div className="border-l-2 border-purple-400 pl-3 space-y-3">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-sm font-medium">🇫🇷 Français</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleAutoTranslate('fr')}
                        disabled={isTranslatingFr || !editingArticle}
                        className="h-7 text-xs"
                      >
                        {isTranslatingFr ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        Auto-übersetzen
                      </Button>
                    </div>
                    <Textarea 
                      {...form.register('description_fr')} 
                      placeholder="Description..."
                      className="min-h-[50px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('grape_variety_fr')} 
                      placeholder="Cépage..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('flavor_profile_fr')} 
                      placeholder="Profil aromatique..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Textarea 
                      {...form.register('food_pairings_fr')} 
                      placeholder="Accords mets-vins..."
                      className="min-h-[40px] resize-none text-sm"
                    />
                    <Input 
                      {...form.register('origin_country_fr')} 
                      placeholder="Pays d'origine..."
                      className="text-sm"
                    />
                  </div>
                  
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Description for non-wine articles */}
          {!isWineCategory && (
            <div className="space-y-2">
              <Label htmlFor="article-description">Beschreibung</Label>
              <Textarea 
                id="article-description" 
                {...form.register('description')} 
                placeholder="Produktbeschreibung..."
                className="min-h-[80px] resize-y"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="article-reference-price">Referenzpreis (€)</Label>
              <Input 
                id="article-reference-price" 
                type="text" 
                inputMode="decimal"
                {...form.register('reference_price')} 
                placeholder="10,00" 
              />
              {form.formState.errors.reference_price && (
                <p className="text-sm text-destructive">{form.formState.errors.reference_price.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Referenzeinheit</Label>
              <Controller
                name="reference_unit"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="z.B. kg, L" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border z-50">
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="100g">100g</SelectItem>
                      <SelectItem value="100ml">100ml</SelectItem>
                      {units.filter(u => !['kg', 'L', '100g', '100ml'].includes(u)).map((unit) => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Referenzpreis ist optional und dient zum Preisvergleich (z.B. €/kg)
          </p>

          {/* Location Assignment Section - only show if more than 1 location exists */}
          {locations.length > 1 && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Verfügbar an Standorten
              </Label>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-muted/30">
                {locations.map(location => (
                  <div key={location.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`loc-${location.id}`}
                      checked={selectedLocationIds.includes(location.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLocationIds(prev => [...prev, location.id]);
                        } else {
                          setSelectedLocationIds(prev => prev.filter(id => id !== location.id));
                        }
                      }}
                    />
                    <label 
                      htmlFor={`loc-${location.id}`} 
                      className="text-base font-semibold cursor-pointer"
                    >
                      {location.short_code || location.name}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Wähle die Standorte, an denen dieser Artikel verfügbar sein soll
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {editingArticle && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                className="h-10 sm:h-9"
                onClick={() => onDelete(editingArticle)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Löschen
              </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="outline" className="h-10 sm:h-9" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="h-10 sm:h-9" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingArticle ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
