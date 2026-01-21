import { memo, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, Locale } from 'date-fns';
import { ShoppingCart, Trash2, Calendar, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartDraft } from '@/hooks/useCartDrafts';
import { getLocationDisplayName } from './types';

interface DraftCardProps {
  draft: CartDraft;
  onLoad: () => void;
  onDelete: () => void;
  locale: Locale;
}

export const DraftCard = memo(({
  draft,
  onLoad,
  onDelete,
  locale,
}: DraftCardProps) => {
  const { t } = useTranslation();

  const draftTotal = useMemo(() => {
    return draft.items?.reduce((sum, item) => {
      if (item.article) {
        return sum + Number(item.article.price) * (Number(item.article.packaging_unit) || 1) * item.quantity;
      }
      return sum;
    }, 0) || 0;
  }, [draft.items]);

  const draftItemCount = draft.items?.length || 0;

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{draft.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span>{draftItemCount} {t('drafts.articles')}</span>
            <span>•</span>
            <span>€{draftTotal.toFixed(2)}</span>
            {draft.desired_delivery_date && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(draft.desired_delivery_date), 'dd.MM.yyyy', { locale })}
                </span>
              </>
            )}
          </div>
          {(draft as unknown as { location?: { id: string; name: string; short_code: string | null } }).location && (
            <Badge variant="outline" className="mt-2 text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {getLocationDisplayName((draft as unknown as { location: { id: string; name: string; short_code: string | null } }).location)}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Button
            size="sm"
            onClick={onLoad}
            className="h-9"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {t('drafts.loadToCart')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Preview of items */}
      {draft.items && draft.items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          {draft.items.slice(0, 3).map((item) => (
            <div key={item.id} className="text-sm text-muted-foreground flex justify-between">
              <span className="truncate">{item.article?.name || item.free_text_name}</span>
              <span className="ml-2 shrink-0">{item.quantity}x</span>
            </div>
          ))}
          {draft.items.length > 3 && (
            <div className="text-sm text-muted-foreground">
              +{draft.items.length - 3} {t('drafts.moreArticles')}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

DraftCard.displayName = 'DraftCard';
