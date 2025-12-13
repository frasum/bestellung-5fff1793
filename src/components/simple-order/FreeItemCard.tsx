import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { FreeItem } from './FreeItemDialog';

interface FreeItemCardProps {
  item: FreeItem;
  onQuantityChange: (itemId: string, delta: number) => void;
  onEdit: (item: FreeItem) => void;
  onDelete: (itemId: string) => void;
}

export function FreeItemCard({ 
  item, 
  onQuantityChange, 
  onEdit,
  onDelete,
}: FreeItemCardProps) {
  const { t } = useTranslation();
  const { lightTap, mediumTap } = useHapticFeedback();

  const handleQuantityChange = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    lightTap();
    onQuantityChange(item.id, delta);
  };

  const handleEdit = () => {
    mediumTap();
    onEdit(item);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    mediumTap();
    onDelete(item.id);
  };

  return (
    <Card 
      onClick={handleEdit}
      className={cn(
        "p-3 transition-colors cursor-pointer",
        "border-l-4 border-l-amber-500 hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base leading-tight">
              {item.name}
            </h3>
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-700 dark:text-amber-400">
              {t('simpleOrder.freeItem', 'Frei')}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full touch-manipulation"
            onClick={(e) => handleQuantityChange(-1, e)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-6 w-6" />
          </Button>
          
          <div className="min-w-12 text-center">
            <span className="text-xl font-bold">{item.quantity}</span>
            <span className="block text-xs text-muted-foreground leading-tight">
              {item.unit}
            </span>
          </div>
          
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full touch-manipulation"
            onClick={(e) => handleQuantityChange(1, e)}
          >
            <Plus className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
