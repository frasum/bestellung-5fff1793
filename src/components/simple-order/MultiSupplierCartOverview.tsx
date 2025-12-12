import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Check, 
  Minus, 
  Plus, 
  Trash2, 
  Loader2, 
  Calendar, 
  Clock,
  ChevronDown,
  ChevronUp,
  Package
} from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { format } from 'date-fns';
import { de, enUS, fr, it, th, vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Article {
  id: string;
  name: string;
  price: number;
  unit: string;
  supplier_id: string;
  order_unit?: {
    id: string;
    name: string;
    quantity: number;
  } | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface MultiSupplierCartOverviewProps {
  articles: Article[];
  quantities: Record<string, number>;
  suppliers: Supplier[];
  deliveryDate: Date | undefined;
  timeWindow: string;
  locationName: string;
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

export const MultiSupplierCartOverview = ({
  articles,
  quantities,
  suppliers,
  deliveryDate,
  timeWindow,
  locationName,
  onQuantityChange,
  onRemoveItem,
  onBack,
  onConfirm,
  isSubmitting,
}: MultiSupplierCartOverviewProps) => {
  const { t, i18n } = useTranslation();
  const { lightTap, heavyTap } = useHapticFeedback();
  const locale = getLocale(i18n.language);
  
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const prevQuantitiesRef = useRef<Record<string, number>>({});

  // Get ordered articles
  const orderedArticles = articles.filter(article => quantities[article.id] > 0);

  // Group articles by supplier
  const articlesBySupplier = orderedArticles.reduce((acc, article) => {
    if (!acc[article.supplier_id]) {
      acc[article.supplier_id] = [];
    }
    acc[article.supplier_id].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  // Get suppliers with orders
  const suppliersWithOrders = suppliers.filter(s => articlesBySupplier[s.id]?.length > 0);

  // Initialize all suppliers as expanded
  useEffect(() => {
    setExpandedSuppliers(new Set(suppliersWithOrders.map(s => s.id)));
  }, []);

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

  const toggleSupplier = (supplierId: string) => {
    lightTap();
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const handleQuantityChange = (articleId: string, delta: number) => {
    lightTap();
    prevQuantitiesRef.current = { ...quantities };
    onQuantityChange(articleId, delta);
  };

  const handleRemove = (articleId: string) => {
    heavyTap();
    onRemoveItem(articleId);
  };

  const handleConfirm = () => {
    heavyTap();
    onConfirm();
  };

  // Calculate totals
  const getSupplierTotal = (supplierId: string) => {
    return (articlesBySupplier[supplierId] || []).reduce((sum, article) => {
      return sum + (article.price * (quantities[article.id] || 0));
    }, 0);
  };

  const getSupplierItemCount = (supplierId: string) => {
    return (articlesBySupplier[supplierId] || []).reduce((sum, article) => {
      return sum + (quantities[article.id] || 0);
    }, 0);
  };

  const grandTotal = suppliersWithOrders.reduce((sum, supplier) => {
    return sum + getSupplierTotal(supplier.id);
  }, 0);

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  if (orderedArticles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold text-muted-foreground mb-4">
          {t('simpleOrder.cartEmpty', 'Warenkorb ist leer')}
        </p>
        <Button onClick={onBack} variant="outline" className="h-12">
          <ArrowLeft className="mr-2 h-5 w-5" />
          {t('simpleOrder.backToSuppliers', 'Zurück zu Lieferanten')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <div className="sticky top-0 bg-primary text-primary-foreground z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              {t('simpleOrder.cartOverview', 'Warenkorb')}
              <Badge variant="secondary" className="text-base">
                {totalItems}
              </Badge>
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Delivery Info */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {deliveryDate 
                  ? format(deliveryDate, 'EEE, d. MMM', { locale })
                  : t('simpleOrder.noDate', 'Kein Datum')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>{timeWindow || 'Flexibel'}</span>
            </div>
            {locationName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                📍 {locationName}
              </div>
            )}
          </div>
        </Card>

        {/* Supplier Groups */}
        {suppliersWithOrders.map((supplier) => {
          const isExpanded = expandedSuppliers.has(supplier.id);
          const supplierArticles = articlesBySupplier[supplier.id] || [];
          const supplierTotal = getSupplierTotal(supplier.id);
          const itemCount = getSupplierItemCount(supplier.id);

          return (
            <Collapsible
              key={supplier.id}
              open={isExpanded}
              onOpenChange={() => toggleSupplier(supplier.id)}
            >
              <Card className="overflow-hidden">
                {/* Supplier Header */}
                <CollapsibleTrigger asChild>
                  <div className="p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors touch-manipulation">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{supplier.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {itemCount} {t('simpleOrder.items', 'Artikel')} · {supplierTotal.toFixed(2)} €
                          </p>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                {/* Articles */}
                <CollapsibleContent>
                  <div className="divide-y">
                    {supplierArticles.map((article) => {
                      const quantity = quantities[article.id] || 0;
                      const itemTotal = article.price * quantity;

                      return (
                        <div key={article.id} className="p-4 flex items-center gap-3">
                          {/* Article Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{article.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{article.price.toFixed(2)} €/{article.unit}</span>
                              {article.order_unit && (
                                <Badge variant="outline" className="text-xs">
                                  {article.order_unit.quantity}× {article.order_unit.name}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 touch-manipulation"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(article.id, -1);
                              }}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className={cn(
                              "w-10 text-center text-lg font-bold transition-transform duration-200",
                              animatingIds.has(article.id) && "scale-125 text-primary"
                            )}>
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-10 w-10 touch-manipulation"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(article.id, 1);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(article.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {/* Grand Total */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {suppliersWithOrders.length} {t('simpleOrder.suppliers', 'Lieferanten')}
              </p>
              <p className="text-lg font-semibold">
                {t('simpleOrder.grandTotal', 'Gesamtsumme')}
              </p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {grandTotal.toFixed(2)} €
            </p>
          </div>
        </Card>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 pb-safe">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="h-14 w-14 sm:w-auto sm:flex-1 touch-manipulation"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-6 w-6 sm:mr-2" />
            <span className="hidden sm:inline">
              {t('simpleOrder.backToSuppliers', 'Zurück')}
            </span>
          </Button>
          <Button
            className="flex-1 h-14 text-lg font-semibold touch-manipulation"
            onClick={handleConfirm}
            disabled={isSubmitting || orderedArticles.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                {t('simpleOrder.sending', 'Wird gesendet...')}
              </>
            ) : (
              <>
                <Check className="mr-2 h-6 w-6" />
                {t('simpleOrder.confirmAll', 'Alle bestellen')}
                <Badge variant="secondary" className="ml-2">
                  {suppliersWithOrders.length}
                </Badge>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
