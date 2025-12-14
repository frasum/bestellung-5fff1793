import { useMemo, useState } from 'react';
import { Wine, MapPin, Euro, ChevronRight, ChevronDown, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Article } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

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
  const sellingPrice = (wine as any).selling_price;
  const hasSellingPrice = sellingPrice != null && sellingPrice > 0;

  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group relative"
      onClick={onEdit}
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
  );
};
