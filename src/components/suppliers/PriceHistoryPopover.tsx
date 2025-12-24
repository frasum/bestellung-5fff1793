import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { History, Loader2, FileText, ShoppingCart } from 'lucide-react';
import { usePriceHistory, PriceHistoryEntry } from '@/hooks/usePriceHistory';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface PriceHistoryPopoverProps {
  articleId: string;
  articleName: string;
}

export const PriceHistoryPopover = ({ articleId, articleName }: PriceHistoryPopoverProps) => {
  const { data: history, isLoading } = usePriceHistory(articleId);
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de });
  };

  const getSourceInfo = (entry: PriceHistoryEntry) => {
    switch (entry.change_source) {
      case 'supplier_portal': 
        return { label: 'Lieferantenportal', icon: null, link: null };
      case 'manual': 
        return { label: 'Manuell', icon: null, link: null };
      case 'import': 
        return { label: 'CSV-Import', icon: null, link: null };
      case 'invoice':
        return { 
          label: entry.invoices?.invoice_number 
            ? `Rechnung ${entry.invoices.invoice_number}`
            : 'Rechnung',
          icon: FileText,
          link: entry.invoice_id ? `/reports?tab=invoices&invoice=${entry.invoice_id}` : null
        };
      case 'order':
        return {
          label: entry.orders?.order_number
            ? `Bestellung ${entry.orders.order_number}`
            : 'Bestellung',
          icon: ShoppingCart,
          link: entry.order_id ? `/orders?order=${entry.order_id}` : null
        };
      default: 
        return { label: entry.change_source, icon: null, link: null };
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
              {history.map((entry) => {
                const sourceInfo = getSourceInfo(entry);
                const SourceIcon = sourceInfo.icon;
                
                return (
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
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{formatDate(entry.changed_at)}</span>
                      {sourceInfo.link ? (
                        <button
                          onClick={() => navigate(sourceInfo.link!)}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {SourceIcon && <SourceIcon className="h-3 w-3" />}
                          {sourceInfo.label}
                        </button>
                      ) : (
                        <span className="flex items-center gap-1">
                          {SourceIcon && <SourceIcon className="h-3 w-3" />}
                          {sourceInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
