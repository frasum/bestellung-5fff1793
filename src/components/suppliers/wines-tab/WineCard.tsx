import React, { useState, memo } from 'react';
import { Wine, MapPin, Euro, Pencil, Search, Loader2, Grape, Utensils, AlertCircle, ImageIcon, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Article, useUpdateArticle } from '@/hooks/useArticles';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { WineCardProps, WineResearchResult } from './types';
import { getLocalizedField, getMissingFields } from './utils';
import { WineResearchDialog } from './WineResearchDialog';

export const WineCard = memo(({ wine, onEdit }: WineCardProps) => {
  const { t } = useTranslation();
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState<WineResearchResult | null>(null);
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const updateArticle = useUpdateArticle();
  
  const sellingPrice = wine.selling_price;
  const hasSellingPrice = sellingPrice != null && sellingPrice > 0;
  
  const missing = getMissingFields(wine);
  const isIncomplete = missing.description || missing.grapeVariety || missing.originCountry || missing.image;

  const handleResearch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResearching(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('research-wine', {
        body: { wineName: wine.name, origin_country: wine.origin_country },
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
        ...(researchResult.description !== notFound && { description: researchResult.description }),
        ...(researchResult.grape_variety !== notFound && { grape_variety: researchResult.grape_variety }),
        ...(researchResult.flavor_profile !== notFound && { flavor_profile: researchResult.flavor_profile }),
        ...(researchResult.food_pairings !== notFound && { food_pairings: researchResult.food_pairings }),
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

            {missing.originCountry && (
              <p className="text-sm text-orange-500 italic flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {t('wines.missingOriginCountry', 'Kein Herkunftsland')}
              </p>
            )}

            {missing.image && (
              <p className="text-sm text-orange-500 italic flex items-center gap-1">
                <ImageIcon className="h-3 w-3" />
                {t('wines.missingImage', 'Kein Foto')}
              </p>
            )}

            {getLocalizedField(wine, 'flavor_profile') && (
              <div className="flex items-start gap-1.5 text-sm">
                <Wine className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{getLocalizedField(wine, 'flavor_profile')}</span>
              </div>
            )}

            {getLocalizedField(wine, 'food_pairings') && (
              <div className="flex items-start gap-1.5 text-sm">
                <Utensils className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground line-clamp-2">{getLocalizedField(wine, 'food_pairings')}</span>
              </div>
            )}

            {(wine as Article & { special_attributes?: string }).special_attributes && (
              <div className="flex items-start gap-1.5 text-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{(wine as Article & { special_attributes?: string }).special_attributes}</span>
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

            {hasSellingPrice ? (
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
            ) : (
              <div className="pt-3 border-t mt-3">
                <span className="text-sm text-muted-foreground italic">
                  {t('wines.noSellingPrice', 'Kein Verkaufspreis hinterlegt')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <WineResearchDialog
        open={showResearchDialog}
        onOpenChange={setShowResearchDialog}
        wine={wine}
        researchResult={researchResult}
        onApplyResearch={handleApplyResearch}
        isPending={updateArticle.isPending}
      />
    </>
  );
});

WineCard.displayName = 'WineCard';
