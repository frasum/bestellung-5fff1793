import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format, Locale } from 'date-fns';
import { 
  ChevronRight, Smartphone, Bell, ShoppingCart, 
  Trash2, Calendar, MapPin 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartDraft } from '@/hooks/useCartDrafts';
import { cn } from '@/lib/utils';
import { EasyOrderGroup, getLocationDisplayName } from './types';

interface EasyOrderGroupCardProps {
  group: EasyOrderGroup;
  isOpen: boolean;
  onToggle: () => void;
  onLoadToCart: () => void;
  onDelete: () => void;
  onLoadSingleDraft: (draft: CartDraft) => void;
  locale: Locale;
}

export const EasyOrderGroupCard = ({
  group,
  isOpen,
  onToggle,
  onLoadToCart,
  onDelete,
  onLoadSingleDraft,
  locale,
}: EasyOrderGroupCardProps) => {
  const { t } = useTranslation();

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="bg-card border border-primary/30 rounded-xl overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <ChevronRight className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0",
                isOpen && "rotate-90"
              )} />
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-primary" />
                <Bell className="w-4 h-4 text-red-500 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    EasyOrder: {group.employeeName}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {group.supplierNames.join(', ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span>{group.totalItems} Artikel</span>
                  <span>•</span>
                  <span>€{group.totalPrice.toFixed(2)}</span>
                  {group.desiredDeliveryDate && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(group.desiredDeliveryDate), 'dd.MM.yyyy', { locale })}
                      </span>
                    </>
                  )}
                  {group.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {getLocationDisplayName(group.location)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 sm:mt-0 ml-auto" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadToCart();
                }}
                className="h-9"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {t('drafts.loadToCart')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {group.drafts.map((draft, idx) => (
              <div 
                key={draft.id}
                className="bg-muted/50 border border-border rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">
                      {group.supplierNames[idx] || 'Lieferant'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({draft.items?.length || 0} Artikel)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoadSingleDraft(draft)}
                    className="h-8"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Einzeln laden
                  </Button>
                </div>
                {draft.items && draft.items.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {draft.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="text-xs text-muted-foreground flex justify-between">
                        <span>{item.article?.name || item.free_text_name}</span>
                        <span>{item.quantity}x</span>
                      </div>
                    ))}
                    {draft.items.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{draft.items.length - 3} weitere...
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
