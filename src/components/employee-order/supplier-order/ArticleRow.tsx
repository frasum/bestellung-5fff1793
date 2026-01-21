import React, { memo } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Article } from './types';

interface ArticleRowProps {
  article: Article;
  cartQuantity: number;
  onAdd: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

export const ArticleRow = memo(({ article, cartQuantity, onAdd, onUpdateQuantity }: ArticleRowProps) => {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{article.name}</h3>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {article.unit}
          </Badge>
        </div>
        {article.order_unit_name && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Bestelleinheit: {article.order_unit_name}
          </p>
        )}
      </div>
      
      {cartQuantity > 0 ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onUpdateQuantity(cartQuantity - 1)}
          >
            {cartQuantity === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </Button>
          <Input
            type="number"
            value={cartQuantity}
            className="w-14 h-9 text-center font-bold text-lg p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={0}
            onClick={(e) => e.currentTarget.select()}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 0;
              onUpdateQuantity(val);
            }}
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => onUpdateQuantity(cartQuantity + 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button onClick={onAdd} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Hinzufügen
        </Button>
      )}
    </div>
  );
});

ArticleRow.displayName = 'ArticleRow';
