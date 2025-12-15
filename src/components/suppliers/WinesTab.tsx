import { useMemo, useState, useCallback, useEffect } from 'react';
import { Wine, MapPin, Euro, ChevronRight, ChevronDown, Pencil, Search, Loader2, ExternalLink, Grape, Utensils, Info, Sparkles, AlertCircle, Camera, ImageIcon, FileDown, Languages } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Article, useUpdateArticle } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateWineCatalogPdf } from '@/lib/wineCatalogPdf';

// Helper function to get localized wine field
const getLocalizedField = (wine: Article, field: string): string => {
  const lang = i18n.language;
  // Only check for localized versions for EN, TH, FR
  if (lang === 'en' || lang === 'th' || lang === 'fr') {
    const localizedKey = `${field}_${lang}` as keyof Article;
    const localizedValue = wine[localizedKey];
    if (localizedValue && typeof localizedValue === 'string') {
      return localizedValue;
    }
  }
  // Fallback to German original
  return (wine[field as keyof Article] as string) || '';
};

interface WineResearchResult {
  description: string;
  grape_variety: string;
  region: string;
  flavor_profile: string;
  food_pairings: string;
  producer_info: string;
  citations: string[];
  image_url?: string;
  image_source?: string;
}

interface WinesTabProps {
  articles: Article[];
  suppliers: Supplier[];
  onEditArticle: (article: Article) => void;
}

type FilterMode = 'all' | 'incomplete' | 'missing-description' | 'missing-grape' | 'missing-origin';

export const WinesTab = ({ articles, suppliers, onEditArticle }: WinesTabProps) => {
  const { t } = useTranslation();
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; wineName: string } | null>(null);
  const [translateProgress, setTranslateProgress] = useState<{ current: number; total: number; wineName: string } | null>(null);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [advancedMode, setAdvancedMode] = useState(() => localStorage.getItem('advanced-settings-enabled') === 'true');
  const updateArticle = useUpdateArticle();

  useEffect(() => {
    const handleStorageChange = () => {
      setAdvancedMode(localStorage.getItem('advanced-settings-enabled') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter articles that have "wein" in category (case-insensitive)
  const wineArticles = useMemo(() => {
    return articles.filter(article => 
      article.category?.toLowerCase().includes('wein') ||
      article.top_category?.toLowerCase().includes('wein')
    );
  }, [articles]);

  // PDF generation handler
  const handleGeneratePdf = useCallback(async () => {
    if (wineArticles.length === 0) return;
    
    setPdfProgress({ current: 0, total: wineArticles.length });
    
    try {
      await generateWineCatalogPdf(
        wineArticles as any,
        suppliers,
        undefined,
        (current, total) => setPdfProgress({ current, total })
      );
      toast.success(t('wines.pdfGenerated', 'Weinkatalog PDF erstellt'));
    } catch (error) {
      console.error('Error generating wine catalog PDF:', error);
      toast.error(t('wines.pdfError', 'Fehler beim Erstellen des PDFs'));
    } finally {
      setPdfProgress(null);
    }
  }, [wineArticles, suppliers, t]);

  // Count incomplete wines (missing description, grape variety, origin country, or image)
  const incompleteCount = useMemo(() => {
    return wineArticles.filter(w => 
      !w.description?.trim() || 
      !w.grape_variety?.trim() ||
      !w.origin_country?.trim() ||
      !w.image_url
    ).length;
  }, [wineArticles]);

  // Filter wines based on filterMode
  const filteredWines = useMemo(() => {
    switch (filterMode) {
      case 'missing-description':
        return wineArticles.filter(w => !w.description?.trim());
      case 'missing-grape':
        return wineArticles.filter(w => !w.grape_variety?.trim());
      case 'missing-origin':
        return wineArticles.filter(w => !w.origin_country?.trim());
      case 'incomplete':
        return wineArticles.filter(w => 
          !w.description?.trim() || 
          !w.grape_variety?.trim() ||
          !w.origin_country?.trim() ||
          !w.image_url
        );
      default:
        return wineArticles;
    }
  }, [wineArticles, filterMode]);

  // Wines without description (candidates for batch research)
  const winesWithoutDescription = useMemo(() => {
    return wineArticles.filter(wine => !wine.description?.trim());
  }, [wineArticles]);

  // Group wines by supplier
  const winesBySupplier = useMemo(() => {
    const grouped: Record<string, Article[]> = {};
    filteredWines.forEach(article => {
      if (!grouped[article.supplier_id]) {
        grouped[article.supplier_id] = [];
      }
      grouped[article.supplier_id].push(article);
    });
    // Sort wines within each supplier by name
    Object.keys(grouped).forEach(supplierId => {
      grouped[supplierId].sort((a, b) => a.name.localeCompare(b.name));
    });
    return grouped;
  }, [filteredWines]);

  // Get suppliers that have wines
  const suppliersWithWines = useMemo(() => {
    return suppliers
      .filter(s => winesBySupplier[s.id]?.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, winesBySupplier]);

  // Batch research function
  const handleBatchResearch = useCallback(async () => {
    if (winesWithoutDescription.length === 0) {
      toast.info(t('wines.allWinesHaveDescriptions', 'Alle Weine haben bereits Beschreibungen'));
      return;
    }

    const notFound = 'Keine Informationen gefunden';
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < winesWithoutDescription.length; i++) {
      const wine = winesWithoutDescription[i];
      setBatchProgress({ current: i + 1, total: winesWithoutDescription.length, wineName: wine.name });

      try {
        const { data, error } = await supabase.functions.invoke('research-wine', {
          body: {
            wineName: wine.name,
            origin_country: wine.origin_country,
          },
        });

        if (error) throw error;

        const result = data as WineResearchResult;
        
        await updateArticle.mutateAsync({
          id: wine.id,
          ...(result.description !== notFound && { description: result.description }),
          ...(result.grape_variety !== notFound && { grape_variety: result.grape_variety }),
          ...(result.flavor_profile !== notFound && { flavor_profile: result.flavor_profile }),
          ...(result.food_pairings !== notFound && { food_pairings: result.food_pairings }),
        });

        successCount++;
      } catch (error) {
        console.error(`Error researching wine ${wine.name}:`, error);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setBatchProgress(null);
    
    if (errorCount === 0) {
      toast.success(t('wines.batchResearchComplete', '{{count}} Weine erfolgreich recherchiert', { count: successCount }));
    } else {
      toast.warning(t('wines.batchResearchPartial', '{{success}} erfolgreich, {{errors}} Fehler', { success: successCount, errors: errorCount }));
    }
  }, [winesWithoutDescription, updateArticle, t]);

  if (wineArticles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Wine className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          {t('wines.noWines', 'Keine Weine im Katalog')}
        </h3>
        <p className="text-muted-foreground max-w-md">
          {t('wines.noWinesDescription', 'Fügen Sie Artikel mit der Kategorie "Wein" hinzu, um sie hier anzuzeigen.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats and actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Wine className="h-5 w-5" />
          <span className="text-sm">
            {t('wines.totalWines', '{{count}} Weine von {{suppliers}} Lieferanten', {
              count: wineArticles.length,
              suppliers: suppliers.filter(s => wineArticles.some(w => w.supplier_id === s.id)).length
            })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* PDF Export Button - always visible */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGeneratePdf}
            disabled={pdfProgress !== null || wineArticles.length === 0}
            className="gap-2"
          >
            {pdfProgress ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {t('wines.exportPdf', 'Weinkarte PDF')}
          </Button>

          {/* Batch Research Button - only in advanced mode */}
          {advancedMode && winesWithoutDescription.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchResearch}
              disabled={batchProgress !== null || translateProgress !== null}
              className="gap-2"
            >
              {batchProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t('wines.batchResearch', 'Alle recherchieren')}
              <Badge variant="secondary" className="ml-1">
                {winesWithoutDescription.length}
              </Badge>
            </Button>
          )}

          {/* Batch Translate Button - always visible */}
          {wineArticles.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setTranslateProgress({ current: 0, total: wineArticles.length * 3, wineName: '' });
                let successCount = 0;
                
                for (let i = 0; i < wineArticles.length; i++) {
                  const wine = wineArticles[i];
                  const langs = ['en', 'th', 'fr'] as const;
                  const langLabels = { en: 'EN', th: 'TH', fr: 'FR' };
                  
                  for (let j = 0; j < langs.length; j++) {
                    const lang = langs[j];
                    setTranslateProgress({ current: i * 3 + j + 1, total: wineArticles.length * 3, wineName: `${wine.name} (${langLabels[lang]})` });
                    
                    try {
                      await supabase.functions.invoke('translate-wine-content', {
                        body: { articleId: wine.id, targetLanguage: lang },
                      });
                    } catch (error) {
                      console.error(`Error translating ${wine.name} to ${lang}:`, error);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                  
                  successCount++;
                }
                
                setTranslateProgress(null);
                toast.success(t('wines.batchTranslateComplete', '{{count}} Weine übersetzt', { count: successCount }));
              }}
              disabled={batchProgress !== null || translateProgress !== null}
              className="gap-2"
            >
              {translateProgress ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Languages className="h-4 w-4" />
              )}
              {t('wines.batchTranslate', 'Alle übersetzen')}
            </Button>
          )}
        </div>
      </div>

      {/* PDF Progress */}
      {pdfProgress && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('wines.generatingPdf', 'Erstelle PDF...')}
            </span>
            <span className="text-muted-foreground">
              {pdfProgress.current} / {pdfProgress.total}
            </span>
          </div>
          <Progress value={(pdfProgress.current / pdfProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Filter Toggle */}
      <ToggleGroup 
        type="single" 
        value={filterMode} 
        onValueChange={(value) => value && setFilterMode(value as FilterMode)}
        className="justify-start"
      >
        <ToggleGroupItem value="all" className="gap-1.5">
          {t('wines.filterAll', 'Alle')}
          <Badge variant="secondary" className="text-xs">
            {wineArticles.length}
          </Badge>
        </ToggleGroupItem>
        <ToggleGroupItem value="incomplete" className="gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          {t('wines.filterIncomplete', 'Unvollständig')}
          {incompleteCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {incompleteCount}
            </Badge>
          )}
        </ToggleGroupItem>
        <ToggleGroupItem value="missing-description" className="gap-1.5 hidden sm:flex">
          {t('wines.filterMissingDescription', 'Ohne Beschreibung')}
          <Badge variant="secondary" className="text-xs">
            {winesWithoutDescription.length}
          </Badge>
        </ToggleGroupItem>
        <ToggleGroupItem value="missing-grape" className="gap-1.5 hidden sm:flex">
          <Grape className="h-3.5 w-3.5" />
          {t('wines.filterMissingGrape', 'Ohne Rebsorte')}
          <Badge variant="secondary" className="text-xs">
            {wineArticles.filter(w => !w.grape_variety?.trim()).length}
          </Badge>
        </ToggleGroupItem>
        <ToggleGroupItem value="missing-origin" className="gap-1.5 hidden sm:flex">
          <MapPin className="h-3.5 w-3.5" />
          {t('wines.filterMissingOrigin', 'Ohne Herkunftsland')}
          <Badge variant="secondary" className="text-xs">
            {wineArticles.filter(w => !w.origin_country?.trim()).length}
          </Badge>
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Empty state for filter */}
      {filteredWines.length === 0 && filterMode !== 'all' && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
            <Wine className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground">
            {t('wines.noIncompleteWines', 'Alle Weine sind vollständig!')}
          </p>
        </div>
      )}

      {/* Batch Progress */}
      {batchProgress && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('wines.researching', 'Recherchiere')}: <span className="font-medium text-foreground">{batchProgress.wineName}</span>
            </span>
            <span className="text-muted-foreground">
              {batchProgress.current} / {batchProgress.total}
            </span>
          </div>
          <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
        </div>
      )}

      {/* Translation Progress */}
      {translateProgress && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t('wines.translating', 'Übersetze')}: <span className="font-medium text-foreground">{translateProgress.wineName}</span>
            </span>
            <span className="text-muted-foreground">
              {translateProgress.current} / {translateProgress.total}
            </span>
          </div>
          <Progress value={(translateProgress.current / translateProgress.total) * 100} className="h-2" />
        </div>
      )}

      {suppliersWithWines.map(supplier => {
        const isOpen = openSuppliers[supplier.id] === true; // default closed
        return (
          <Collapsible 
            key={supplier.id} 
            open={isOpen}
            onOpenChange={(open) => setOpenSuppliers(prev => ({ ...prev, [supplier.id]: open }))}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform" />
                  )}
                  <Wine className="h-5 w-5 text-primary" />
                  <span className="font-medium">{supplier.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {winesBySupplier[supplier.id].length} {t('wines.winesCount', 'Weine')}
                  </Badge>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                {winesBySupplier[supplier.id].map(wine => (
                  <WineCard key={wine.id} wine={wine} onEdit={() => onEditArticle(wine)} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};

interface WineCardProps {
  wine: Article;
  onEdit: () => void;
}

const WineCard = ({ wine, onEdit }: WineCardProps) => {
  const { t } = useTranslation();
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<WineResearchResult | null>(null);
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const updateArticle = useUpdateArticle();
  
  const sellingPrice = (wine as any).selling_price;
  const hasSellingPrice = sellingPrice != null && sellingPrice > 0;
  
  // Check if wine data is incomplete
  const missingDescription = !wine.description?.trim();
  const missingGrape = !wine.grape_variety?.trim();
  const missingOriginCountry = !wine.origin_country?.trim();
  const missingImage = !wine.image_url;
  const isIncomplete = missingDescription || missingGrape || missingOriginCountry || missingImage;

  const handleResearch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('research-wine', {
        body: {
          wineName: wine.name,
          origin_country: (wine as any).origin_country,
        },
      });

      if (error) throw error;

      setResearchResult(data);
      setShowResearchDialog(true);
    } catch (error) {
      console.error('Error researching wine:', error);
      toast.error(t('wines.researchError', 'Fehler bei der Wein-Recherche'));
    } finally {
      setIsResearching(false);
    }
  };

  const handleApplyResearch = async () => {
    if (!researchResult) return;

    const notFound = 'Keine Informationen gefunden';
    
    try {
      await updateArticle.mutateAsync({
        id: wine.id,
        // Only update fields that have actual content
        ...(researchResult.description !== notFound && { description: researchResult.description }),
        ...(researchResult.grape_variety !== notFound && { grape_variety: researchResult.grape_variety }),
        ...(researchResult.flavor_profile !== notFound && { flavor_profile: researchResult.flavor_profile }),
        ...(researchResult.food_pairings !== notFound && { food_pairings: researchResult.food_pairings }),
        // Also save image if found
        ...(researchResult.image_url && { image_url: researchResult.image_url }),
      });
      toast.success(t('wines.researchApplied', 'Recherche-Ergebnisse übernommen'));
      setShowResearchDialog(false);
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error(t('wines.updateError', 'Fehler beim Speichern'));
    }
  };

  return (
    <>
      <Card 
        className={cn(
          "overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative",
          isIncomplete && "ring-2 ring-orange-400/50 border-orange-400"
        )}
        onClick={onEdit}
      >
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={handleResearch}
            disabled={isResearching}
          >
            {isResearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
          <div className="bg-primary text-primary-foreground rounded-full p-1.5">
            <Pencil className="h-3.5 w-3.5" />
          </div>
        </div>
        {wine.image_url && (
          <div className="aspect-[4/3] overflow-hidden bg-gradient-to-b from-muted/50 to-muted">
            <img
              src={wine.image_url}
              alt={wine.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <CardContent className={cn("p-4", !wine.image_url && "pt-4")}>
          <div className="space-y-2">
            {/* Incomplete indicator badge - inline */}
            {isIncomplete && (
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-300 gap-1 text-xs mb-1">
                <AlertCircle className="h-3 w-3" />
                {t('wines.incomplete', 'Unvollständig')}
              </Badge>
            )}
            
            <h4 className="font-medium text-foreground line-clamp-2">{wine.name}</h4>
            
            {getLocalizedField(wine, 'description') ? (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {getLocalizedField(wine, 'description')}
              </p>
            ) : (
              <p className="text-sm text-orange-500 italic flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('wines.missingDescription', 'Keine Beschreibung')}
              </p>
            )}

            {/* Grape Variety */}
            {getLocalizedField(wine, 'grape_variety') ? (
              <div className="flex items-center gap-1.5 text-sm">
                <Grape className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="text-muted-foreground">{getLocalizedField(wine, 'grape_variety')}</span>
              </div>
            ) : (
              <p className="text-sm text-orange-500 italic flex items-center gap-1">
                <Grape className="h-3 w-3" />
                {t('wines.missingGrapeVariety', 'Keine Rebsorte')}
              </p>
            )}

            {/* Missing Origin Country Warning */}
            {missingOriginCountry && (
              <p className="text-sm text-orange-500 italic flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t('wines.missingOriginCountry', 'Kein Herkunftsland')}
              </p>
            )}

            {/* Missing Image Warning */}
            {missingImage && (
              <p className="text-sm text-orange-500 italic flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {t('wines.missingImage', 'Kein Foto')}
              </p>
            )}

            {/* Flavor Profile */}
            {getLocalizedField(wine, 'flavor_profile') && (
              <div className="flex items-start gap-1.5 text-sm">
                <Wine className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{getLocalizedField(wine, 'flavor_profile')}</span>
              </div>
            )}

            {/* Food Pairings */}
            {getLocalizedField(wine, 'food_pairings') && (
              <div className="flex items-start gap-1.5 text-sm">
                <Utensils className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{getLocalizedField(wine, 'food_pairings')}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {getLocalizedField(wine, 'origin_country') && (
                <Badge variant="outline" className="text-xs gap-1">
                  <MapPin className="h-3 w-3" />
                  {getLocalizedField(wine, 'origin_country')}
                </Badge>
              )}
              {wine.category && (
                <Badge variant="secondary" className="text-xs">
                  {wine.category}
                </Badge>
              )}
            </div>

            {/* Selling Price - prominent display */}
            {hasSellingPrice && (
              <div className="pt-3 border-t mt-3">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-primary" />
                  <span className="text-lg font-semibold text-primary">
                    {Number(sellingPrice).toLocaleString('de-DE', { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })} €
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('wines.sellingPrice', 'Verkaufspreis')}
                  </span>
                </div>
              </div>
            )}

            {!hasSellingPrice && (
              <div className="pt-3 border-t mt-3">
                <span className="text-sm text-muted-foreground italic">
                  {t('wines.noSellingPrice', 'Kein Verkaufspreis hinterlegt')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Research Results Dialog */}
      <Dialog open={showResearchDialog} onOpenChange={setShowResearchDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              {t('wines.researchResults', 'Recherche-Ergebnisse')}
            </DialogTitle>
            <DialogDescription>{wine.name}</DialogDescription>
          </DialogHeader>

          {researchResult && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Found Product Image */}
                {researchResult.image_url && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Camera className="h-4 w-4" />
                      {t('wines.foundProductImage', 'Gefundenes Produktfoto')}
                    </div>
                    <div className="relative aspect-video max-w-xs rounded-lg overflow-hidden bg-muted border">
                      <img 
                        src={researchResult.image_url} 
                        alt={wine.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {researchResult.image_source && (
                      <a 
                        href={researchResult.image_source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t('wines.imageSource', 'Bildquelle')}
                      </a>
                    )}
                  </div>
                )}

                {!researchResult.image_url && (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4" />
                    {t('wines.noImageFound', 'Kein Produktfoto gefunden')}
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Info className="h-4 w-4" />
                    {t('wines.description', 'Beschreibung')}
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {researchResult.description}
                  </p>
                </div>

                {/* Grape Variety */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Grape className="h-4 w-4" />
                    {t('wines.grapeVariety', 'Rebsorte')}
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {researchResult.grape_variety}
                  </p>
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPin className="h-4 w-4" />
                    {t('wines.region', 'Region')}
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {researchResult.region}
                  </p>
                </div>

                {/* Flavor Profile */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Wine className="h-4 w-4" />
                    {t('wines.flavorProfile', 'Geschmacksprofil')}
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {researchResult.flavor_profile}
                  </p>
                </div>

                {/* Food Pairings */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Utensils className="h-4 w-4" />
                    {t('wines.foodPairings', 'Speiseempfehlungen')}
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {researchResult.food_pairings}
                  </p>
                </div>

                {/* Producer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Info className="h-4 w-4" />
                    {t('wines.producerInfo', 'Weingut')}
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {researchResult.producer_info}
                  </p>
                </div>

                {/* Citations */}
                {researchResult.citations && researchResult.citations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ExternalLink className="h-4 w-4" />
                      {t('wines.sources', 'Quellen')}
                    </div>
                    <div className="space-y-1">
                      {researchResult.citations.map((citation, index) => (
                        <a
                          key={index}
                          href={citation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline block truncate"
                        >
                          {citation}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowResearchDialog(false)}>
              {t('common.close', 'Schließen')}
            </Button>
            <Button onClick={handleApplyResearch} disabled={updateArticle.isPending}>
              {updateArticle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('wines.applyResearch', 'In Beschreibung übernehmen')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
