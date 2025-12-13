import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, Pencil, Trash2, PenLine } from 'lucide-react';
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

  const handleQuantityChange = (delta: number) => {
    lightTap();
    onQuantityChange(item.id, delta);
  };

  const handleEdit = () => {
    mediumTap();
    onEdit(item);
  };

  const handleDelete = () => {
    mediumTap();
    onDelete(item.id);
  };

  return (
    <Card className={cn(
      "p-3 transition-colors border-dashed border-2",
      "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20"
    )}>
      <div className="flex items-center gap-3">
        {/* Edit button */}
        <button
          onClick={handleEdit}
          className="flex-shrink-0 min-h-11 min-w-11 p-2 -ml-1 rounded-full hover:bg-muted transition-colors touch-manipulation"
        >
          <Pencil className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base leading-tight">
              {item.name}
            </h3>
            <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-700 dark:text-amber-400">
              <PenLine className="h-3 w-3 mr-1" />
              {t('simpleOrder.freeItem', 'Frei')}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {item.unit}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full touch-manipulation"
            onClick={() => handleQuantityChange(-1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-6 w-6" />
          </Button>
          
          <div className="min-w-12 text-center">
            <span className="text-xl font-bold">{item.quantity}</span>
          </div>
          
          <Button
            variant="default"
            size="icon"
            className="h-12 w-12 rounded-full touch-manipulation"
            onClick={() => handleQuantityChange(1)}
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
