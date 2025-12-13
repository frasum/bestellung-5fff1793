import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Search, Star, Minus, Plus, Loader2, Trash2 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { DeliveryDateSection } from './DeliveryDateSection';

interface Article {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string | null;
  sku: string | null;
  packaging_unit: number | null;
  supplier_id: string;
}

interface DraftItem {
  id: string;
  quantity: number;
  article: {
    id: string;
    name: string;
    unit: string;
    price: number;
    supplier_id: string;
    supplier: {
      id: string;
      name: string;
    };
  };
}

interface Draft {
  id: string;
  name: string;
  notes: string | null;
  location_id: string | null;
  desired_delivery_date: string | null;
  desired_time_window: string | null;
  items: DraftItem[];
}

interface EmployeeOrderEditProps {
  draft: Draft;
  articles: Article[];
  favoriteIds: Set<string>;
  onToggleFavorite: (articleId: string) => void;
  onSave: (items: { article_id: string; quantity: number }[], deliveryDate: Date | undefined, timeWindow: string) => void;
  onCancel: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}

export const EmployeeOrderEdit = ({
  draft,
  articles,
  favoriteIds,
  onToggleFavorite,
  onSave,
  onCancel,
  onDelete,
  isSaving,
  isDeleting,
}: EmployeeOrderEditProps) => {
  const { t } = useTranslation();
  const { lightTap, mediumTap, heavyTap } = useHapticFeedback();
  
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    draft.desired_delivery_date ? new Date(draft.desired_delivery_date) : undefined
  );
  const [timeWindow, setTimeWindow] = useState(draft.desired_time_window || 'flexible');

  // Initialize quantities from draft items
  useEffect(() => {
    const initialQuantities: Record<string, number> = {};
    draft.items.forEach((item) => {
      if (item.article?.id) {
        initialQuantities[item.article.id] = item.quantity;
      }
    });
    setQuantities(initialQuantities);
  }, [draft.items]);

  const handleQuantityChange = (articleId: string, delta: number) => {
    lightTap();
    setQuantities((prev) => {
      const current = prev[articleId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [articleId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [articleId]: newValue };
    });
  };

  const handleSave = () => {
    heavyTap();
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([articleId, quantity]) => ({
        article_id: articleId,
        quantity,
      }));
    onSave(items, deliveryDate, timeWindow);
  };

  const handleCancel = () => {
    mediumTap();
    onCancel();
  };

  const handleDelete = () => {
    mediumTap();
    onDelete();
  };

  const handleToggleFavorite = (articleId: string) => {
    mediumTap();
    onToggleFavorite(articleId);
  };

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  // Filter and sort articles
  const filteredArticles = articles.filter((article) => {
    const searchLower = search.toLowerCase();
    return (
      article.name.toLowerCase().includes(searchLower) ||
      article.sku?.toLowerCase().includes(searchLower) ||
      article.category?.toLowerCase().includes(searchLower)
    );
  });

  // Sort: favorites first, then by sort_order/name
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    const aFav = favoriteIds.has(a.id);
    const bFav = favoriteIds.has(b.id);
    if (aFav !== bFav) return aFav ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const supplierName = draft.items[0]?.article?.supplier?.name || 
    (draft.notes?.startsWith('Lieferant:') ? draft.notes.replace('Lieferant:', '').trim() : '');

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-11 w-11 touch-manipulation"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">
              {t('simpleOrder.editOrder', 'Bestellung bearbeiten')}
            </h1>
            {supplierName && (
              <p className="text-sm text-muted-foreground">{supplierName}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-11 w-11 touch-manipulation text-destructive hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Delivery Date */}
      <DeliveryDateSection
        deliveryDate={deliveryDate}
        onDeliveryDateChange={setDeliveryDate}
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
      />

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('simpleOrder.searchArticle', 'Artikel suchen...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Articles List */}
      <div className="p-4 space-y-3">
        {sortedArticles.map((article) => {
          const qty = quantities[article.id] || 0;
          const isFavorite = favoriteIds.has(article.id);

          return (
            <Card
              key={article.id}
              className={cn(
                'p-4 transition-colors',
                qty > 0 && 'border-primary bg-primary/5'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Favorite Toggle */}
                <button
                  onClick={() => handleToggleFavorite(article.id)}
                  className="min-h-11 min-w-11 p-2 flex items-center justify-center touch-manipulation"
                >
                  <Star
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                    )}
                  />
                </button>

                {/* Article Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{article.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    €{article.price.toFixed(2)} / {article.unit}
                    {article.packaging_unit && article.packaging_unit > 1 && (
                      <span className="ml-1">({article.packaging_unit}er)</span>
                    )}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(article.id, -1)}
                    disabled={qty === 0}
                    className="h-12 w-12 touch-manipulation"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="w-10 text-center text-lg font-medium">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(article.id, 1)}
                    className="h-12 w-12 touch-manipulation"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving || getTotalItems() === 0}
          className="w-full h-14 text-lg font-semibold touch-manipulation"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              {t('common.saving')}
            </>
          ) : (
            <>
              {t('simpleOrder.saveChanges', 'Änderungen speichern')} ({getTotalItems()})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
