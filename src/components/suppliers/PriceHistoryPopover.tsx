import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { History, Loader2 } from 'lucide-react';
import { usePriceHistory } from '@/hooks/usePriceHistory';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PriceHistoryPopoverProps {
  articleId: string;
  articleName: string;
}

export const PriceHistoryPopover = ({ articleId, articleName }: PriceHistoryPopoverProps) => {
  const { data: history, isLoading } = usePriceHistory(articleId);

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'supplier_portal': return 'Lieferantenportal';
      case 'manual': return 'Manuell';
      case 'import': return 'Import';
      default: return source;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <History className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="font-medium text-sm">Preishistorie: {articleName}</div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !history?.length ? (
            <div className="text-sm text-muted-foreground py-2">
              Keine Preisänderungen vorhanden
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((entry) => (
                <div 
                  key={entry.id} 
                  className="border rounded-md p-2 text-sm space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground line-through">
                      {formatPrice(entry.old_price)}
                    </span>
                    <span className="text-foreground font-medium">
                      {formatPrice(entry.new_price)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatDate(entry.changed_at)}</span>
                    <span>{getSourceLabel(entry.change_source)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
