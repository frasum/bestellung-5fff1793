import { memo } from 'react';
import { Pencil, Trash2, Plus, Minus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Article } from '@/hooks/useArticles';
import { OrderUnit } from '@/hooks/useOrderUnits';
import { cn } from '@/lib/utils';
import { LastOrderInfo } from '@/hooks/useLastOrderByArticle';
import { format } from 'date-fns';

interface ArticleCardProps {
  article: Article;
  cartQty: number;
  hasPendingChanges?: boolean;
  lastOrder?: LastOrderInfo;
  orderUnits?: OrderUnit[];
  onUpdateQuantity: (articleId: string, quantity: number) => void;
  onAddToCart: (article: Article, quantity: number) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onPendingClick?: () => void;
}

export const ArticleCard = memo(({
  article,
  cartQty,
  hasPendingChanges = false,
  lastOrder,
  orderUnits = [],
  onUpdateQuantity,
  onAddToCart,
  onEdit,
  onDelete,
  onPendingClick
}: ArticleCardProps) => {
  const orderUnit = article.order_unit_id 
    ? orderUnits.find(u => u.id === article.order_unit_id)
    : null;
  return (
    <Card className={cn(
      "p-2 md:p-3",
      cartQty > 0 && "ring-2 ring-destructive/50 bg-destructive/5"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p 
              className={cn(
                "font-medium text-foreground",
                hasPendingChanges && "cursor-pointer hover:underline"
              )}
              onClick={() => hasPendingChanges && onPendingClick?.()}
            >
              {article.name}
            </p>
            {hasPendingChanges && (
              <span 
                className="w-2 h-2 rounded-full bg-orange-500 animate-pulse cursor-pointer shrink-0" 
                title="Ausstehende Änderungen"
                onClick={onPendingClick}
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            {article.category && (
              <span className="text-primary font-medium">{article.category}</span>
            )}
            {article.sku && (
              <span>SKU: {article.sku}</span>
            )}
            <span>{article.suppliers?.name}</span>
            {lastOrder && (
              <span 
                className="text-muted-foreground/70"
                title={format(new Date(lastOrder.date), 'dd.MM.yyyy')}
              >
                · {lastOrder.quantity}× {format(new Date(lastOrder.date), 'dd.MM.')}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-foreground">€{Number(article.price).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">/{article.unit}</p>
          {/* Immer Bestelleinheit anzeigen: order_unit falls vorhanden, sonst unit als Fallback */}
          <Badge variant="outline" className="text-xs gap-1 font-normal mt-1">
            <Package className="h-3 w-3" />
            {orderUnit ? `${orderUnit.quantity}× ${orderUnit.name}` : `1× ${article.unit}`}
          </Badge>
          {article.reference_price && article.reference_unit && (
            <p className="text-xs text-muted-foreground/70 italic">
              (€{Number(article.reference_price).toFixed(2)}/{article.reference_unit})
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 gap-2">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 md:h-11 md:w-11"
            onClick={() => onUpdateQuantity(article.id, cartQty - 1)}
            disabled={cartQty === 0}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <input
            type="text"
            inputMode="numeric"
            value={cartQty}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val) && val >= 0) {
                onUpdateQuantity(article.id, val);
              } else if (e.target.value === '') {
                onUpdateQuantity(article.id, 0);
              }
            }}
            onFocus={(e) => {
              const target = e.target;
              setTimeout(() => target.select(), 0);
            }}
            className={cn(
              "w-12 h-9 md:w-14 md:h-11 text-center font-medium rounded-md border border-input bg-background text-base",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              cartQty > 0 ? "text-destructive" : "text-foreground"
            )}
          />
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 md:h-11 md:w-11"
            onClick={() => onAddToCart(article, 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-1 md:gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 md:h-11 md:w-11" 
            onClick={() => onEdit(article)}
          >
            <Pencil className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 md:h-11 md:w-11 text-destructive hover:text-destructive" 
            onClick={() => onDelete(article)}
          >
            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

ArticleCard.displayName = 'ArticleCard';
