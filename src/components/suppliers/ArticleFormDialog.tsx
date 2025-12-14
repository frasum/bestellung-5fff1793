import { useEffect, useState } from 'react';
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
import { Check, ChevronsUpDown, Loader2, Plus, Package, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Article } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { articleSchema, ArticleFormData } from './schemas';
import { useOrderUnits, useCreateOrderUnit } from '@/hooks/useOrderUnits';
import { ArticlePhotoCapture } from './ArticlePhotoCapture';
import { supabase } from '@/integrations/supabase/client';

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingArticle: Article | null;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  onSubmit: (data: ArticleFormData, capturedImage?: string, imageCleared?: boolean) => Promise<void>;
  isPending: boolean;
}

export const ArticleFormDialog = ({
  open,
  onOpenChange,
  editingArticle,
  suppliers,
  categories,
  units,
  onSubmit,
  isPending
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
  
  const { data: orderUnits = [] } = useOrderUnits();
  const createOrderUnit = useCreateOrderUnit();

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

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '', origin_country: '', packaging_unit: '', order_unit_id: '', reference_price: '', reference_unit: '', selling_price: '', grape_variety: '', flavor_profile: '', food_pairings: '' },
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
      });
      setCapturedImage((editingArticle as any).image_url || null);
    } else {
      form.reset({ supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '', origin_country: '', packaging_unit: '', order_unit_id: '', reference_price: '', reference_unit: '', selling_price: '', grape_variety: '', flavor_profile: '', food_pairings: '' });
      setCapturedImage(null);
    }
    setImageCleared(false);
  }, [editingArticle, form]);

  const handleSubmit = async (data: ArticleFormData) => {
    await onSubmit(data, capturedImage || undefined, imageCleared);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3 sm:space-y-4">
          {/* AI Photo Capture - only in advanced mode */}
          {advancedSettingsEnabled && (
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
          <div className="space-y-2">
            <Label htmlFor="article-name">Name *</Label>
            <Input id="article-name" {...form.register('name')} placeholder="San Marzano Tomatoes" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="article-description">Beschreibung</Label>
            <Textarea 
              id="article-description" 
              {...form.register('description')} 
              placeholder="Produktbeschreibung..."
              className="min-h-[100px] resize-y"
            />
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
              <Input id="article-price" type="number" step="0.01" {...form.register('price')} placeholder="4.50" />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="article-sku">SKU</Label>
              <Input id="article-sku" {...form.register('sku')} placeholder="TOM-001" />
            </div>
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
                              {selectedUnit.quantity}× {selectedUnit.name}
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
                                  <span>{unit.quantity}× {unit.name}</span>
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
          {watchedCategory && watchedCategory.toLowerCase().includes('wein') && (
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
                      <SelectItem value="RSA">RSA (Südafrika)</SelectItem>
                      <SelectItem value="Neue Welt">Neue Welt</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Selling Price - only visible for wine categories */}
          {watchedCategory && watchedCategory.toLowerCase().includes('wein') && (
            <div className="space-y-2">
              <Label htmlFor="article-selling-price">Verkaufspreis (€) 🍷</Label>
              <Input 
                id="article-selling-price" 
                type="number"
                step="0.01"
                {...form.register('selling_price')} 
                placeholder="z.B. 42.00" 
              />
              <p className="text-xs text-muted-foreground">
                Verkaufspreis im Restaurant (für Mitarbeiter sichtbar)
              </p>
            </div>
          )}

          {/* Grape Variety - only visible for wine categories */}
          {watchedCategory && watchedCategory.toLowerCase().includes('wein') && (
            <div className="space-y-2">
              <Label htmlFor="article-grape-variety">Traubensorte 🍇</Label>
              <Textarea 
                id="article-grape-variety" 
                {...form.register('grape_variety')} 
                placeholder="z.B. Riesling, Spätburgunder, Cuvée aus Merlot und Cabernet..."
                className="min-h-[60px] resize-y"
              />
            </div>
          )}

          {/* Flavor Profile - only visible for wine categories */}
          {watchedCategory && watchedCategory.toLowerCase().includes('wein') && (
            <div className="space-y-2">
              <Label htmlFor="article-flavor-profile">Geschmacksprofil 🍷</Label>
              <Textarea 
                id="article-flavor-profile" 
                {...form.register('flavor_profile')} 
                placeholder="z.B. fruchtig mit Noten von Kirsche und Vanille, samtige Tannine..."
                className="min-h-[80px] resize-y"
              />
            </div>
          )}

          {/* Food Pairings - only visible for wine categories */}
          {watchedCategory && watchedCategory.toLowerCase().includes('wein') && (
            <div className="space-y-2">
              <Label htmlFor="article-food-pairings">Speiseempfehlungen 🍽️</Label>
              <Textarea 
                id="article-food-pairings" 
                {...form.register('food_pairings')} 
                placeholder="z.B. Passt hervorragend zu Lamm, gegrilltem Gemüse, reifem Käse..."
                className="min-h-[60px] resize-y"
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
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1 h-10 sm:h-9" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1 h-10 sm:h-9" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingArticle ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
