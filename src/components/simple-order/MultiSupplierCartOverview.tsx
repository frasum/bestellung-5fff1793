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
  Package,
  PlusCircle,
  PenLine
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
import { AddArticleSheetSimple } from './AddArticleSheetSimple';
import { FreeItemDialog, FreeItem } from './FreeItemDialog';
import { FreeItemCard } from './FreeItemCard';

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
  allArticles: Article[];
  // Free items props
  freeItems?: FreeItem[];
  onAddFreeItem?: (item: Omit<FreeItem, 'id'>) => void;
  onUpdateFreeItem?: (item: FreeItem) => void;
  onDeleteFreeItem?: (itemId: string) => void;
  onFreeItemQuantityChange?: (itemId: string, delta: number) => void;
  canAddFreeItems?: boolean;
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
  allArticles,
  freeItems = [],
  onAddFreeItem,
  onUpdateFreeItem,
  onDeleteFreeItem,
  onFreeItemQuantityChange,
  canAddFreeItems = false,
}: MultiSupplierCartOverviewProps) => {
  const { t, i18n } = useTranslation();
  const { lightTap, heavyTap } = useHapticFeedback();
  const locale = getLocale(i18n.language);
  
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const [addArticleSheet, setAddArticleSheet] = useState<{
    open: boolean;
    supplierId: string | null;
    supplierName: string;
  }>({ open: false, supplierId: null, supplierName: '' });
  const [freeItemDialog, setFreeItemDialog] = useState<{
    open: boolean;
    supplierId: string | null;
    editingItem: FreeItem | null;
  }>({ open: false, supplierId: null, editingItem: null });
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

  // Group free items by supplier
  const freeItemsBySupplier = freeItems.reduce((acc, item) => {
    if (!acc[item.supplier_id]) {
      acc[item.supplier_id] = [];
    }
    acc[item.supplier_id].push(item);
    return acc;
  }, {} as Record<string, FreeItem[]>);

  // Get all supplier IDs with orders (regular or free items)
  const supplierIdsWithOrders = new Set([
    ...Object.keys(articlesBySupplier),
    ...Object.keys(freeItemsBySupplier),
  ]);

  // Get suppliers with orders
  const suppliersWithOrders = suppliers.filter(s => supplierIdsWithOrders.has(s.id));

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

  // Calculate totals (including free items)
  const getSupplierItemCount = (supplierId: string) => {
    const articleCount = (articlesBySupplier[supplierId] || []).reduce((sum, article) => {
      return sum + (quantities[article.id] || 0);
    }, 0);
    const freeItemCount = (freeItemsBySupplier[supplierId] || []).reduce((sum, item) => {
      return sum + item.quantity;
    }, 0);
    return articleCount + freeItemCount;
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0) +
    freeItems.reduce((sum, item) => sum + item.quantity, 0);

  const hasAnyItems = orderedArticles.length > 0 || freeItems.length > 0;

  if (!hasAnyItems) {
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
        <Card className="p-4 bg-muted/30">
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
          const itemCount = getSupplierItemCount(supplier.id);

          const supplierFreeItems = freeItemsBySupplier[supplier.id] || [];

          return (
            <Collapsible
              key={supplier.id}
              open={isExpanded}
              onOpenChange={() => toggleSupplier(supplier.id)}
            >
              <Card className="overflow-hidden">
                {/* Supplier Header */}
                <div className="p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-3 flex-1 cursor-pointer touch-manipulation">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{supplier.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {itemCount} {t('simpleOrder.items', 'Artikel')}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-1 ml-2">
                      {canAddFreeItems && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFreeItemDialog({
                              open: true,
                              supplierId: supplier.id,
                              editingItem: null
                            });
                          }}
                        >
                          <PenLine className="h-4 w-4 mr-1" />
                          {t('simpleOrder.freeItem', 'Frei')}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 text-primary hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddArticleSheet({
                            open: true,
                            supplierId: supplier.id,
                            supplierName: supplier.name
                          });
                        }}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        {t('cart.addArticle', 'Artikel')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Articles */}
                <CollapsibleContent>
                  <div className="divide-y">
                    {/* Free Items */}
                    {supplierFreeItems.map((item) => (
                      <div key={item.id} className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-amber-500/50">
                        <FreeItemCard
                          item={item}
                          onQuantityChange={onFreeItemQuantityChange || (() => {})}
                          onEdit={(editItem) => setFreeItemDialog({
                            open: true,
                            supplierId: supplier.id,
                            editingItem: editItem
                          })}
                          onDelete={onDeleteFreeItem || (() => {})}
                        />
                      </div>
                    ))}

                    {/* Regular Articles */}
                    {supplierArticles.map((article) => {
                      const quantity = quantities[article.id] || 0;

                      return (
                        <div key={article.id} className="p-4 flex items-center gap-3">
                          {/* Article Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{article.name}</p>
                            {article.order_unit && (
                              <Badge variant="outline" className="text-xs">
                                {article.order_unit.name}
                              </Badge>
                            )}
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

        {/* Summary */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">
                {suppliersWithOrders.length} {suppliersWithOrders.length === 1 
                  ? t('simpleOrder.supplier', 'Lieferant') 
                  : t('simpleOrder.suppliers', 'Lieferanten')}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalItems} {t('simpleOrder.items', 'Artikel')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Action Bar - Option D */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe">
        <div className="max-w-2xl mx-auto">
          {/* Info Row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <button
              onClick={onBack}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('simpleOrder.changeSuppliers', 'Lieferanten ändern')}</span>
            </button>
            <span className="text-sm text-muted-foreground">
              {suppliersWithOrders.length} {suppliersWithOrders.length === 1 ? t('simpleOrder.supplier', 'Lieferant') : t('simpleOrder.suppliers', 'Lieferanten')} • {totalItems} {t('simpleOrder.items', 'Artikel')}
            </span>
          </div>
          {/* Main Action Button */}
          <div className="p-4">
            <Button
              className="w-full h-14 text-lg font-semibold touch-manipulation"
              onClick={handleConfirm}
              disabled={isSubmitting || !hasAnyItems}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  {t('simpleOrder.sending', 'Wird gesendet...')}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-6 w-6" />
                  {t('simpleOrder.submitOrder', 'Bestellung absenden')}
                  <Badge variant="secondary" className="ml-2">
                    {totalItems}
                  </Badge>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add Article Sheet */}
      <AddArticleSheetSimple
        open={addArticleSheet.open}
        onOpenChange={(open) => setAddArticleSheet(prev => ({ ...prev, open }))}
        supplierId={addArticleSheet.supplierId}
        supplierName={addArticleSheet.supplierName}
        quantities={quantities}
        onQuantityChange={onQuantityChange}
        articles={allArticles}
      />

      {/* Free Item Dialog */}
      {freeItemDialog.supplierId && (
        <FreeItemDialog
          open={freeItemDialog.open}
          onOpenChange={(open) => setFreeItemDialog(prev => ({ ...prev, open, editingItem: open ? prev.editingItem : null }))}
          onAdd={onAddFreeItem || (() => {})}
          supplierId={freeItemDialog.supplierId}
          editingItem={freeItemDialog.editingItem}
          onUpdate={onUpdateFreeItem}
        />
      )}
    </div>
  );
};
