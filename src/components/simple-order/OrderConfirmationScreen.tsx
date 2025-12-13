import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Check, Minus, Plus, Trash2, Loader2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  name: string;
  price: number;
  unit: string;
  order_unit?: {
    id: string;
    name: string;
    quantity: number;
  } | null;
}

interface OrderConfirmationScreenProps {
  articles: Article[];
  quantities: Record<string, number>;
  supplierName: string;
  deliveryDate: Date | undefined;
  timeWindow: string;
  onQuantityChange: (articleId: string, delta: number) => void;
  onRemoveItem: (articleId: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

const getLocale = (lang: string) => {
  switch (lang) {
    case 'de': return de;
    case 'fr': return fr;
    case 'it': return it;
    case 'th': return th;
    case 'vi': return vi;
    default: return enUS;
  }
};

export const OrderConfirmationScreen = ({
  articles,
  quantities,
  supplierName,
  deliveryDate,
  timeWindow,
  onQuantityChange,
  onRemoveItem,
  onBack,
  onConfirm,
  isSubmitting,
}: OrderConfirmationScreenProps) => {
  const { t, i18n } = useTranslation();
  const { lightTap, heavyTap } = useHapticFeedback();
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const prevQuantitiesRef = useRef<Record<string, number>>({});

  // Track quantity changes for animation
  useEffect(() => {
    const newAnimatingIds = new Set<string>();
    Object.keys(quantities).forEach(id => {
      if (prevQuantitiesRef.current[id] !== undefined && 
          prevQuantitiesRef.current[id] !== quantities[id]) {
        newAnimatingIds.add(id);
      }
    });
    
    if (newAnimatingIds.size > 0) {
      setAnimatingIds(newAnimatingIds);
      const timer = setTimeout(() => setAnimatingIds(new Set()), 200);
      return () => clearTimeout(timer);
    }
    
    prevQuantitiesRef.current = { ...quantities };
  }, [quantities]);

  // Get only articles that are in the order
  const orderedArticles = articles.filter(article => quantities[article.id] > 0);

  // Calculate total
  const totalAmount = orderedArticles.reduce((sum, article) => {
    return sum + (article.price * quantities[article.id]);
  }, 0);

  const handleQuantityChange = (articleId: string, delta: number) => {
    lightTap();
    prevQuantitiesRef.current = { ...quantities };
    onQuantityChange(articleId, delta);
  };

  const handleRemoveItem = (articleId: string) => {
    lightTap();
    onRemoveItem(articleId);
  };

  const handleConfirm = () => {
    heavyTap();
    onConfirm();
  };

  const formatDeliveryDate = () => {
    if (!deliveryDate) return t('simpleOrder.noDateSelected', 'Kein Datum gewählt');
    return format(deliveryDate, 'EEEE, d. MMMM', { locale: getLocale(i18n.language) });
  };

  const getTimeWindowLabel = () => {
    if (timeWindow === 'flexible') return t('checkout.flexible', 'Flexibel');
    return timeWindow;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pt-[max(1rem,env(safe-area-inset-top))] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/20 h-11 w-11"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                {t('simpleOrder.orderSummary', 'Bestellübersicht')} ({orderedArticles.length})
              </h1>
              <p className="text-primary-foreground/80 text-sm">{supplierName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Delivery Info */}
        <Card className={cn(
          "transition-colors",
          !deliveryDate ? "border-warning/50" : "bg-muted/30"
        )}>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              <div className={cn(
                "flex items-center gap-2",
                !deliveryDate 
                  ? "text-orange-600 dark:text-orange-400 font-medium" 
                  : "text-muted-foreground"
              )}>
                {!deliveryDate ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Calendar className="h-5 w-5" />
                )}
                <span className="text-sm">{formatDeliveryDate()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>{getTimeWindowLabel()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Article List */}
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
                {orderedArticles.map(article => {
                const quantity = quantities[article.id];
                const lineTotal = article.price * quantity;
                const orderUnitName = article.order_unit?.name;

                return (
                  <div key={article.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium truncate">{article.name}</p>
                        <p className="text-sm text-muted-foreground">
                          €{article.price.toFixed(2)} / {orderUnitName || article.unit}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 opacity-60"
                        onClick={() => handleRemoveItem(article.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 touch-manipulation"
                          onClick={() => handleQuantityChange(article.id, -1)}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className={cn(
                          "w-12 text-center text-xl font-bold transition-transform duration-200",
                          animatingIds.has(article.id) && "scale-125 text-primary"
                        )}>
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-12 w-12 touch-manipulation"
                          onClick={() => handleQuantityChange(article.id, 1)}
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                        {orderUnitName && (
                          <span className="ml-1 text-sm text-muted-foreground">
                            × {orderUnitName}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold">
                        €{lineTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card className="bg-muted/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{t('simpleOrder.totalAmount', 'Gesamtsumme')}</span>
              <span className="text-2xl font-bold text-primary">€{totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-14 w-14 sm:w-auto sm:flex-1 touch-manipulation"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">{t('simpleOrder.backToArticles', 'Zurück zu Artikeln')}</span>
          </Button>
          <Button
            size="lg"
            className={cn(
              "flex-1 h-14 text-lg font-bold gap-2 touch-manipulation",
              !deliveryDate 
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            )}
            onClick={handleConfirm}
            disabled={isSubmitting || orderedArticles.length === 0 || !deliveryDate}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('simpleOrder.submitting', 'Wird gesendet...')}
              </>
            ) : !deliveryDate ? (
              <>
                <AlertCircle className="h-5 w-5" />
                {t('simpleOrder.selectDateFirst', 'Datum wählen')}
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                {t('simpleOrder.confirmOrder', 'Bestellung bestätigen')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
