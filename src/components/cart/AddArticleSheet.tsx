import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Minus, Check } from 'lucide-react';
import { useArticlesBySupplier } from '@/hooks/useArticles';
import { useCart } from '@/contexts/CartContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AddArticleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
}

export const AddArticleSheet = ({
  open,
  onOpenChange,
  supplierId,
  supplierName,
}: AddArticleSheetProps) => {
  const { t } = useTranslation();
  const { lightTap } = useHapticFeedback();
  const { data: articles, isLoading } = useArticlesBySupplier(open ? supplierId : null);
  const { items, addItem, updateQuantity } = useCart();
  const [searchQuery, setSearchQuery] = useState('');

  // Get cart quantities for this supplier's articles
  const cartQuantities = useMemo(() => {
    const quantities: Record<string, number> = {};
    items.forEach(item => {
      quantities[item.article.id] = item.quantity;
    });
    return quantities;
  }, [items]);

  // Filter and sort articles - items in cart first
  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    
    const query = searchQuery.toLowerCase();
    const filtered = articles.filter(article => 
      article.name.toLowerCase().includes(query) ||
      article.sku?.toLowerCase().includes(query) ||
      article.category?.toLowerCase().includes(query) ||
      article.description?.toLowerCase().includes(query)
    );

    // Sort: items in cart first, then alphabetically
    return filtered.sort((a, b) => {
      const aInCart = cartQuantities[a.id] > 0;
      const bInCart = cartQuantities[b.id] > 0;
      if (aInCart && !bInCart) return -1;
      if (!aInCart && bInCart) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [articles, searchQuery, cartQuantities]);

  const handleQuantityChange = (article: any, delta: number) => {
    lightTap();
    const currentQty = cartQuantities[article.id] || 0;
    const newQty = Math.max(0, currentQty + delta);
    
    if (newQty === 0 && currentQty > 0) {
      updateQuantity(article.id, 0);
    } else if (newQty > 0 && currentQty === 0) {
      addItem(article, newQty);
    } else if (newQty > 0) {
      updateQuantity(article.id, newQty);
    }
  };

  const itemsInCartCount = filteredArticles.filter(a => cartQuantities[a.id] > 0).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-left">{supplierName}</SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
              autoFocus
            />
          </div>
          {itemsInCartCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                {t('cart.itemCount', { count: itemsInCartCount })}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? t('common.noResults') : t('articles.noArticles')}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredArticles.map((article) => {
                const inCart = cartQuantities[article.id] || 0;
                return (
                  <div 
                    key={article.id} 
                    className={`p-4 ${inCart > 0 ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm">
                          {article.name}
                        </h4>
                        {article.sku && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            SKU: {article.sku}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          €{Number(article.price).toFixed(2)} / {article.unit}
                          {article.packaging_unit && article.packaging_unit > 1 && (
                            <span className="ml-1">({article.packaging_unit}er)</span>
                          )}
                        </p>
                        {inCart > 0 && (
                          <Badge variant="default" className="mt-1.5 text-xs">
                            {t('cart.inCart')}: {inCart}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="icon"
                          variant={inCart > 0 ? "default" : "outline"}
                          className="h-11 w-11 touch-manipulation"
                          onClick={() => handleQuantityChange(article, -1)}
                          disabled={inCart === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="w-10 text-center font-medium text-foreground">
                          {inCart}
                        </div>
                        <Button
                          size="icon"
                          variant={inCart > 0 ? "default" : "outline"}
                          className="h-11 w-11 touch-manipulation"
                          onClick={() => handleQuantityChange(article, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background">
          <Button 
            className="w-full h-12" 
            onClick={() => onOpenChange(false)}
          >
            {t('common.done')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
