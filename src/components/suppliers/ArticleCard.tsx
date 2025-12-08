import { Pencil, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Article } from '@/hooks/useArticles';
import { cn } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  cartQty: number;
  onUpdateQuantity: (articleId: string, quantity: number) => void;
  onAddToCart: (article: Article, quantity: number) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
}

export const ArticleCard = ({
  article,
  cartQty,
  onUpdateQuantity,
  onAddToCart,
  onEdit,
  onDelete
}: ArticleCardProps) => {
  return (
    <Card className={cn(
      "p-4",
      cartQty > 0 && "ring-2 ring-destructive/50 bg-destructive/5"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{article.name}</p>
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
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10"
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
              "w-14 h-10 text-center font-medium rounded-md border border-input bg-background text-base",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              cartQty > 0 ? "text-destructive" : "text-foreground"
            )}
          />
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10"
            onClick={() => onAddToCart(article, 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10" 
            onClick={() => onEdit(article)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-destructive hover:text-destructive" 
            onClick={() => onDelete(article)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
