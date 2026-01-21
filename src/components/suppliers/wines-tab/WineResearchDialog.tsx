import { Wine, MapPin, Search, Loader2, Grape, Utensils, Info, ExternalLink, Camera, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Article } from '@/hooks/useArticles';
import { useTranslation } from 'react-i18next';
import { WineResearchResult } from './types';

interface WineResearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wine: Article;
  researchResult: WineResearchResult | null;
  onApplyResearch: () => void;
  isPending: boolean;
}

export const WineResearchDialog = ({
  open,
  onOpenChange,
  wine,
  researchResult,
  onApplyResearch,
  isPending,
}: WineResearchDialogProps) => {
  const { t } = useTranslation();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.close', 'Schließen')}
          </Button>
          <Button onClick={onApplyResearch} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('wines.applyResearch', 'In Beschreibung übernehmen')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
