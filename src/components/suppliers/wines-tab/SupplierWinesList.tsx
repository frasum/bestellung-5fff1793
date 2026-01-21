import { Wine, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Article } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { useTranslation } from 'react-i18next';
import { WineCard } from './WineCard';

interface SupplierWinesListProps {
  suppliersWithWines: Supplier[];
  winesBySupplier: Record<string, Article[]>;
  openSuppliers: Record<string, boolean>;
  setOpenSuppliers: (fn: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  onEditArticle: (article: Article) => void;
}

export const SupplierWinesList = ({
  suppliersWithWines,
  winesBySupplier,
  openSuppliers,
  setOpenSuppliers,
  onEditArticle,
}: SupplierWinesListProps) => {
  const { t } = useTranslation();
  
  return (
    <>
      {suppliersWithWines.map(supplier => {
        const isOpen = openSuppliers[supplier.id] === true;
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
    </>
  );
};
