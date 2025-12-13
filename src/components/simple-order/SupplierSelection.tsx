import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, ChevronRight } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface Supplier {
  id: string;
  name: string;
  sort_order?: number;
}

interface SupplierSelectionProps {
  suppliers: Supplier[];
  onSelect: (supplierId: string) => void;
  getArticleCount: (supplierId: string) => number;
  getCartCount?: (supplierId: string) => number;
  onViewCart?: () => void;
  totalCartItems?: number;
}

// Sort suppliers: by sort_order if set, otherwise alphabetically
const sortSuppliers = (suppliers: Supplier[]) => {
  return [...suppliers].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name, 'de');
  });
};

export const SupplierSelection = ({
  suppliers,
  onSelect,
  getArticleCount,
  getCartCount,
  onViewCart,
  totalCartItems = 0,
}: SupplierSelectionProps) => {
  const { t } = useTranslation();
  const { mediumTap, heavyTap } = useHapticFeedback();
  const sortedSuppliers = sortSuppliers(suppliers);

  const handleSelect = (supplierId: string) => {
    mediumTap();
    onSelect(supplierId);
  };

  const handleViewCart = () => {
    heavyTap();
    onViewCart?.();
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">
        {t('simpleOrder.selectSupplier', 'Lieferant wählen')}
      </h2>
      <div className="space-y-3">
        {sortedSuppliers.map((supplier) => {
          const cartCount = getCartCount?.(supplier.id) || 0;
          const hasItems = cartCount > 0;

          return (
            <Card
              key={supplier.id}
              className={cn(
                "p-5 min-h-[72px] cursor-pointer transition-colors active:scale-[0.98] touch-manipulation",
                hasItems 
                  ? "border-primary bg-primary/5 hover:bg-primary/10" 
                  : "hover:bg-muted/50"
              )}
              onClick={() => handleSelect(supplier.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasItems && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold">{supplier.name}</h3>
                    {hasItems && (
                      <span className="text-sm text-primary font-medium">
                        {cartCount} {t('simpleOrder.inCart', 'im Warenkorb')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-muted-foreground font-medium">
                    {getArticleCount(supplier.id)} {t('simpleOrder.articles', 'Artikel')}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      {totalCartItems > 0 && onViewCart && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background border-t border-border">
          <div className="max-w-2xl mx-auto">
            <Button
              className="w-full h-14 text-lg font-semibold touch-manipulation"
              onClick={handleViewCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t('simpleOrder.viewCart', 'Warenkorb anzeigen')}
              <Badge variant="secondary" className="ml-2 text-base px-2.5 py-0.5">
                {totalCartItems}
              </Badge>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
