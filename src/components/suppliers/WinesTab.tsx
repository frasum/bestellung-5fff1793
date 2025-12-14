import { useMemo, useState } from 'react';
import { Wine, MapPin, Euro, ChevronRight, ChevronDown, Pencil, Search, Loader2, ExternalLink, Grape, Utensils, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Article, useUpdateArticle } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WineResearchResult {
  description: string;
  grape_variety: string;
  region: string;
  flavor_profile: string;
  food_pairings: string;
  producer_info: string;
  citations: string[];
}

interface WinesTabProps {
  articles: Article[];
  suppliers: Supplier[];
  onEditArticle: (article: Article) => void;
}

export const WinesTab = ({ articles, suppliers, onEditArticle }: WinesTabProps) => {
  const { t } = useTranslation();
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});

  // Filter articles that have "wein" in category (case-insensitive)
  const wineArticles = useMemo(() => {
    return articles.filter(article => 
      article.category?.toLowerCase().includes('wein') ||
      article.top_category?.toLowerCase().includes('wein')
    );
  }, [articles]);

  // Group wines by supplier
  const winesBySupplier = useMemo(() => {
    const grouped: Record<string, Article[]> = {};
    wineArticles.forEach(article => {
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
  }, [wineArticles]);

  // Get suppliers that have wines
  const suppliersWithWines = useMemo(() => {
    return suppliers
      .filter(s => winesBySupplier[s.id]?.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, winesBySupplier]);

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
      <div className="flex items-center gap-2 text-muted-foreground">
        <Wine className="h-5 w-5" />
        <span className="text-sm">
          {t('wines.totalWines', '{{count}} Weine von {{suppliers}} Lieferanten', {
            count: wineArticles.length,
            suppliers: suppliersWithWines.length
          })}
        </span>
      </div>

      {suppliersWithWines.map(supplier => {
        const isOpen = openSuppliers[supplier.id] !== false; // default open
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

    // Build comprehensive description
    const parts: string[] = [];
    if (researchResult.description && researchResult.description !== 'Keine Informationen gefunden') {
      parts.push(researchResult.description);
    }
    if (researchResult.grape_variety && researchResult.grape_variety !== 'Keine Informationen gefunden') {
      parts.push(`Rebsorte: ${researchResult.grape_variety}`);
    }
    if (researchResult.flavor_profile && researchResult.flavor_profile !== 'Keine Informationen gefunden') {
      parts.push(`Geschmack: ${researchResult.flavor_profile}`);
    }
    if (researchResult.food_pairings && researchResult.food_pairings !== 'Keine Informationen gefunden') {
      parts.push(`Passt zu: ${researchResult.food_pairings}`);
    }
    
    const newDescription = parts.join('\n\n');

    try {
      await updateArticle.mutateAsync({
        id: wine.id,
        description: newDescription,
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
        className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
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
          <div className="aspect-[4/3] overflow-hidden bg-muted">
            <img
              src={wine.image_url}
              alt={wine.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className={cn("p-4", !wine.image_url && "pt-4")}>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground line-clamp-2">{wine.name}</h4>
            
            {wine.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {wine.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {(wine as any).origin_country && (
                <Badge variant="outline" className="text-xs gap-1">
                  <MapPin className="h-3 w-3" />
                  {(wine as any).origin_country}
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
