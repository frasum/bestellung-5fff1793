import { Pencil, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Article } from '@/hooks/useArticles';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  cartQty: number;
  hasPendingChanges?: boolean;
  onUpdateQuantity: (articleId: string, quantity: number) => void;
  onAddToCart: (article: Article, quantity: number) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onPendingClick?: () => void;
}

export const ArticleCard = ({
  article,
  cartQty,
  hasPendingChanges = false,
  onUpdateQuantity,
  onAddToCart,
  onEdit,
  onDelete,
  onPendingClick
}: ArticleCardProps) => {
  return (
    <Card className={cn(
      "p-4",
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
            <span className="text-muted-foreground">{article.suppliers?.name}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-foreground">€{Number(article.price).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">/{article.unit}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 gap-2">
        {/* Quantity Controls */}
        <div className="flex items-center gap-2 md:gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11 md:h-12 md:w-12"
            onClick={() => onUpdateQuantity(article.id, cartQty - 1)}
            disabled={cartQty === 0}
          >
            <Minus className="w-4 h-4 md:w-5 md:h-5" />
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
              "w-14 h-11 md:w-16 md:h-12 text-center font-medium rounded-md border border-input bg-background text-base md:text-lg",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              cartQty > 0 ? "text-destructive" : "text-foreground"
            )}
          />
          <Button
            size="icon"
            variant="outline"
            className="h-11 w-11 md:h-12 md:w-12"
            onClick={() => onAddToCart(article, 1)}
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
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
};
