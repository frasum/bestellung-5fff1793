import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Wine, Grape, MapPin, Utensils, Euro, X, Check, Loader2, FileDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { generateWineCatalogPdf } from '@/lib/wineCatalogPdf';

interface WineArticle {
  id: string;
  name: string;
  description: string | null;
  selling_price: number | null;
  origin_country: string | null;
  grape_variety: string | null;
  flavor_profile: string | null;
  food_pairings: string | null;
  image_url: string | null;
  category: string | null;
  supplier_id: string;
  supplier: {
    id: string;
    name: string;
  };
}

interface WineCatalogViewProps {
  organizationId: string;
  permission: 'view' | 'edit';
  onBack: () => void;
  token: string;
}

export const WineCatalogView = ({ organizationId, permission, onBack, token }: WineCatalogViewProps) => {
  const { t } = useTranslation();
  const [wines, setWines] = useState<WineArticle[]>([]);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingWine, setEditingWine] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WineArticle>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    console.log('[WineCatalogView] component mounted', { token });
    if (token) {
      loadData();
    }
  }, [token]);
 
  const [loadError, setLoadError] = useState<string | null>(null);
 
  const loadData = useCallback(async () => {
    console.log('[WineCatalogView] loadData start');
    setIsLoading(true);
    setLoadError(null);
    try {
      // Load wines via Edge Function (bypasses RLS)
      console.log('[WineCatalogView] Calling Edge Function with token:', token.substring(0, 8) + '...');
      const { data, error } = await supabase.functions.invoke('verify-simple-order-token', {
        body: { token, action: 'get-wines' },
      });

      console.log('[WineCatalogView] Edge Function response:', { data, error });
 
      if (error) {
        console.error('[WineCatalogView] Network/invoke error:', error);
        setLoadError(error.message || 'Netzwerkfehler');
        toast.error(t('common.error', 'Fehler beim Laden der Weinkarte'));
        return;
      }

      if (data?.error) {
        console.error('[WineCatalogView] API error:', data.error);
        setLoadError(data.error);
        toast.error(data.error);
        return;
      }
 
      console.log('[WineCatalogView] Loaded wines:', data.wines?.length || 0);
      setWines(data.wines || []);
      setOrganizationName(data.organization_name || '');
    } catch (err) {
      console.error('[WineCatalogView] Unexpected error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setLoadError(errorMsg);
      toast.error(t('common.error', 'Fehler beim Laden'));
    } finally {
      console.log('[WineCatalogView] loadData finished');
      setIsLoading(false);
    }
  }, [token, t]);

  const filteredWines = wines.filter(wine => 
    wine.name.toLowerCase().includes(search.toLowerCase()) ||
    wine.description?.toLowerCase().includes(search.toLowerCase()) ||
    wine.grape_variety?.toLowerCase().includes(search.toLowerCase()) ||
    wine.origin_country?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedBySupplier = filteredWines.reduce((acc, wine) => {
    const supplierId = wine.supplier?.id || 'unknown';
    if (!acc[supplierId]) {
      acc[supplierId] = {
        name: wine.supplier?.name || 'Unbekannt',
        wines: [],
      };
    }
    acc[supplierId].wines.push(wine);
    return acc;
  }, {} as Record<string, { name: string; wines: WineArticle[] }>);

  const startEditing = (wine: WineArticle) => {
    setEditingWine(wine.id);
    setEditForm({
      description: wine.description || '',
      selling_price: wine.selling_price,
      origin_country: wine.origin_country || '',
      grape_variety: wine.grape_variety || '',
      flavor_profile: wine.flavor_profile || '',
      food_pairings: wine.food_pairings || '',
    });
  };

  const cancelEditing = () => {
    setEditingWine(null);
    setEditForm({});
  };

  const saveWine = async () => {
    if (!editingWine) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          description: editForm.description || null,
          selling_price: editForm.selling_price || null,
          origin_country: editForm.origin_country || null,
          grape_variety: editForm.grape_variety || null,
          flavor_profile: editForm.flavor_profile || null,
          food_pairings: editForm.food_pairings || null,
        })
        .eq('id', editingWine);

      if (error) throw error;
      
      toast.success(t('common.saved', 'Gespeichert'));
      setEditingWine(null);
      setEditForm({});
      loadData();
    } catch (err) {
      console.error('Error saving wine:', err);
      toast.error(t('common.error', 'Fehler beim Speichern'));
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price == null) return '-';
    return `€${price.toFixed(2)}`;
  };

  const handleExportPdf = async () => {
    if (wines.length === 0) {
      toast.error(t('wines.noWines', 'Keine Weine im Katalog'));
      return;
    }

    setIsExportingPdf(true);
    setPdfProgress({ current: 0, total: wines.length });

    try {
      // Extract unique suppliers from wines
      const supplierMap = new Map<string, { id: string; name: string }>();
      wines.forEach(wine => {
        if (wine.supplier && !supplierMap.has(wine.supplier.id)) {
          supplierMap.set(wine.supplier.id, wine.supplier);
        }
      });
      const suppliers = Array.from(supplierMap.values());

      await generateWineCatalogPdf(
        wines,
        suppliers,
        organizationName || undefined,
        (current, total) => setPdfProgress({ current, total })
      );
      
      toast.success(t('wines.pdfExported', 'Weinkarte als PDF exportiert'));
    } catch (err) {
      console.error('Error exporting PDF:', err);
      toast.error(t('common.error', 'Fehler beim Export'));
    } finally {
      setIsExportingPdf(false);
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground border-b border-primary-foreground/10">
        <div className="max-w-2xl mx-auto px-3 py-2">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-11 w-11 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <Wine className="h-5 w-5" />
              <h1 className="text-lg font-bold">{t('wines.ourWines', 'Unsere Weine')}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleExportPdf}
              disabled={isExportingPdf || wines.length === 0}
              className="h-11 w-11 text-primary-foreground hover:bg-primary-foreground/20"
              title={t('wines.exportPdf', 'Als PDF exportieren')}
            >
              {isExportingPdf ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileDown className="h-5 w-5" />
              )}
            </Button>
            {permission === 'edit' && (
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground">
                {t('employees.wineCatalogEdit', 'Bearbeiten')}
              </Badge>
            )}
          </div>
          {isExportingPdf && pdfProgress.total > 0 && (
            <div className="mt-2">
              <Progress value={(pdfProgress.current / pdfProgress.total) * 100} className="h-1" />
              <p className="text-xs text-primary-foreground/70 mt-1 text-center">
                {t('wines.exportingProgress', 'Exportiere {{current}} von {{total}} Weinen...', {
                  current: pdfProgress.current,
                  total: pdfProgress.total,
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search', 'Suchen...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-3 pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{t('common.loading', 'Lädt...')}</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <Wine className="h-12 w-12 text-destructive opacity-50" />
            <div>
              <p className="font-medium text-destructive">{t('common.error', 'Fehler beim Laden')}</p>
              <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
            </div>
            <Button onClick={loadData} variant="outline" className="mt-2">
              <Loader2 className="h-4 w-4 mr-2" />
              {t('common.retry', 'Erneut versuchen')}
            </Button>
          </div>
        ) : wines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wine className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('wines.noWines', 'Keine Weine im Katalog')}</p>
          </div>
        ) : filteredWines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('common.noResults', 'Keine Ergebnisse')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedBySupplier).map(([supplierId, group]) => (
              <div key={supplierId}>
                <h2 className="text-lg font-semibold mb-3 text-foreground">{group.name}</h2>
                <div className="space-y-3">
                  {group.wines.map(wine => (
                    <Card 
                      key={wine.id} 
                      className={`overflow-hidden transition-shadow ${
                        permission === 'edit' && editingWine !== wine.id ? 'cursor-pointer hover:shadow-md' : ''
                      }`}
                      onClick={() => permission === 'edit' && editingWine !== wine.id && startEditing(wine)}
                    >
                      <CardContent className="p-0">
                        {editingWine === wine.id ? (
                          // Edit mode
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-lg">{wine.name}</h3>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => { e.stopPropagation(); cancelEditing(); }}
                                  disabled={isSaving}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); saveWine(); }}
                                  disabled={isSaving}
                                >
                                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm text-muted-foreground">{t('wines.sellingPrice', 'VK-Preis')} (€)</label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={editForm.selling_price || ''}
                                  onChange={(e) => setEditForm({ ...editForm, selling_price: parseFloat(e.target.value) || null })}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">{t('wines.originCountry', 'Herkunft')}</label>
                                <Select
                                  value={editForm.origin_country || ''}
                                  onValueChange={(value) => setEditForm({ ...editForm, origin_country: value })}
                                >
                                  <SelectTrigger onClick={(e) => e.stopPropagation()}>
                                    <SelectValue placeholder={t('wines.selectOriginCountry', 'Land wählen')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Österreich">Österreich</SelectItem>
                                    <SelectItem value="Deutschland">Deutschland</SelectItem>
                                    <SelectItem value="Italien">Italien</SelectItem>
                                    <SelectItem value="Frankreich">Frankreich</SelectItem>
                                    <SelectItem value="Spanien">Spanien</SelectItem>
                                    <SelectItem value="Portugal">Portugal</SelectItem>
                                    <SelectItem value="RSA">RSA (Südafrika)</SelectItem>
                                    <SelectItem value="Neue Welt">Neue Welt</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm text-muted-foreground">{t('wines.grapeVariety', 'Rebsorte')}</label>
                              <Input
                                value={editForm.grape_variety || ''}
                                onChange={(e) => setEditForm({ ...editForm, grape_variety: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            <div>
                              <label className="text-sm text-muted-foreground">{t('common.description', 'Beschreibung')}</label>
                              <Textarea
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                rows={3}
                              />
                            </div>

                            <div>
                              <label className="text-sm text-muted-foreground">{t('wines.flavorProfile', 'Geschmack')}</label>
                              <Textarea
                                value={editForm.flavor_profile || ''}
                                onChange={(e) => setEditForm({ ...editForm, flavor_profile: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                rows={2}
                              />
                            </div>

                            <div>
                              <label className="text-sm text-muted-foreground">{t('wines.foodPairings', 'Passt zu')}</label>
                              <Textarea
                                value={editForm.food_pairings || ''}
                                onChange={(e) => setEditForm({ ...editForm, food_pairings: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                rows={2}
                              />
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex">
                            {wine.image_url && (
                              <div className="w-24 h-32 flex-shrink-0 bg-gradient-to-b from-muted/50 to-muted flex items-center justify-center">
                                <img
                                  src={wine.image_url}
                                  alt={wine.name}
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                            )}
                            <div className="flex-1 p-4 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-base leading-tight">{wine.name}</h3>
                                {wine.selling_price != null && (
                                  <Badge variant="secondary" className="flex-shrink-0 gap-1">
                                    <Euro className="h-3 w-3" />
                                    {wine.selling_price.toFixed(2)}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mb-2 text-sm text-muted-foreground">
                                {wine.origin_country && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {wine.origin_country}
                                  </span>
                                )}
                                {wine.grape_variety && (
                                  <span className="flex items-center gap-1">
                                    <Grape className="h-3 w-3" />
                                    {wine.grape_variety}
                                  </span>
                                )}
                              </div>

                              {wine.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {wine.description}
                                </p>
                              )}

                              {wine.food_pairings && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Utensils className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{wine.food_pairings}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
