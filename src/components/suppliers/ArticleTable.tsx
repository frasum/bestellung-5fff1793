import { Fragment, useCallback, memo } from 'react';
import { ChevronRight, Trash2, Bell, Package, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PriceHistoryPopover } from '@/components/suppliers/PriceHistoryPopover';
import { ArticleCard } from '@/components/suppliers/ArticleCard';
import { Article } from '@/hooks/useArticles';
import { SupplierActivityInfo } from '@/hooks/useSupplierChanges';
import { LastOrderInfo } from '@/hooks/useLastOrderByArticle';
import { OrderUnit } from '@/hooks/useOrderUnits';
import { cn, toTitleCase } from '@/lib/utils';
import { format } from 'date-fns';

interface ArticleGroup {
  supplier: { id: string; name: string };
  articles: Article[] | undefined;
}

interface ArticleTableProps {
  groupedBySupplier: ArticleGroup[];
  openSuppliers: Set<string>;
  selectedArticles: Set<string>;
  advancedViewEnabled: boolean;
  pendingChangesBySupplier?: Record<string, number>;
  pendingArticleIds?: Set<string>;
  recentlyActiveSuppliers?: Map<string, SupplierActivityInfo>;
  lastOrderMap?: Record<string, LastOrderInfo>;
  orderUnits?: OrderUnit[];
  cartItemsByArticle?: Map<string, number>;
  onToggleSupplier: (supplierId: string) => void;
  onToggleArticle: (articleId: string) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
  onShowChanges?: (supplierId: string) => void;
  onArticleChangeClick?: (article: Article, supplierId: string, supplierName: string) => void;
  onAddToCart?: (article: Article) => void;
  onRemoveFromCart?: (article: Article) => void;
}

export const ArticleTable = memo(({
  groupedBySupplier,
  openSuppliers,
  selectedArticles,
  advancedViewEnabled,
  pendingChangesBySupplier = {},
  pendingArticleIds = new Set(),
  recentlyActiveSuppliers = new Map(),
  lastOrderMap = {},
  orderUnits = [],
  cartItemsByArticle = new Map(),
  onToggleSupplier,
  onToggleArticle,
  onEdit,
  onDelete,
  onShowChanges,
  onArticleChangeClick,
  onAddToCart,
  onRemoveFromCart
}: ArticleTableProps) => {

  const handleEdit = useCallback((article: Article) => {
    onEdit(article);
  }, [onEdit]);

  const handleDelete = useCallback((article: Article) => {
    onDelete(article);
  }, [onDelete]);

  return (
    <>
      {/* Mobile & Tablet Card View */}
      <div className="xl:hidden space-y-4">
        {groupedBySupplier.map((group) => (
          <Collapsible 
            key={group.supplier.id} 
            open={openSuppliers.has(group.supplier.id)} 
            onOpenChange={() => onToggleSupplier(group.supplier.id)}
          >
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2">
                  <ChevronRight className={cn(
                    "h-5 w-5 md:h-6 md:w-6 transition-transform text-muted-foreground",
                    openSuppliers.has(group.supplier.id) && "rotate-90"
                  )} />
                  <span className="font-semibold md:text-lg text-foreground">
                    {group.supplier.name}
                  </span>
                  {recentlyActiveSuppliers.has(group.supplier.id) && (() => {
                    const activity = recentlyActiveSuppliers.get(group.supplier.id)!;
                    const fieldLabels: Record<string, string> = {
                      price: 'Preis', name: 'Name', sku: 'SKU', description: 'Beschreibung',
                      unit: 'Einheit', category: 'Kategorie', annual_order_value: 'Jahresumsatz'
                    };
                    const changedFieldsText = activity.changedFields.map(f => fieldLabels[f] || f).join(', ');
                    return (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 cursor-help p-1 -m-1 rounded hover:bg-muted/30">
                            <span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                            <span className="text-xs text-muted-foreground">
                              {activity.lastDate.toLocaleDateString('de-DE')}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="text-sm space-y-1">
                              <p className="font-medium">Kürzlich aktiv</p>
                              {activity.changeCount > 0 && (
                                <p>{activity.changeCount} Änderung{activity.changeCount > 1 ? 'en' : ''}: {changedFieldsText}</p>
                              )}
                              {activity.suggestionCount > 0 && (
                                <p>{activity.suggestionCount} neue Artikelvorschläge</p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })()}
                  {pendingChangesBySupplier[group.supplier.id] > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="animate-pulse cursor-pointer gap-1 text-xs md:text-sm md:h-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowChanges?.(group.supplier.id);
                      }}
                    >
                      <Bell className="h-3 w-3 md:h-4 md:w-4" />
                      {pendingChangesBySupplier[group.supplier.id]}
                    </Badge>
                  )}
                </div>
                <span className="text-sm md:text-base text-muted-foreground">
                  {group.articles?.length || 0} Artikel
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              {/* 2-column grid for tablets, 1-column for mobile */}
              <div className="grid grid-cols-1 gap-2 pt-3">
                {group.articles?.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    hasPendingChanges={pendingArticleIds.has(article.id)}
                    lastOrder={lastOrderMap[article.id]}
                    orderUnits={orderUnits}
                    cartQuantity={cartItemsByArticle.get(article.id) || 0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onPendingClick={() => onArticleChangeClick?.(article, group.supplier.id, group.supplier.name)}
                    onAddToCart={onAddToCart}
                    onRemoveFromCart={onRemoveFromCart}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableBody>
          {groupedBySupplier.map((group) => (
            <Collapsible key={group.supplier.id} open={openSuppliers.has(group.supplier.id)} onOpenChange={() => onToggleSupplier(group.supplier.id)} asChild>
              <Fragment>
                <CollapsibleTrigger asChild>
                  <TableRow className="bg-muted/50 cursor-pointer">
                    <TableCell colSpan={advancedViewEnabled ? 7 : 6} className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <ChevronRight className={cn("h-4 w-4 transition-transform", openSuppliers.has(group.supplier.id) && "rotate-90")} />
                        <span className="font-semibold text-sm text-foreground">{group.supplier.name}</span>
                        {recentlyActiveSuppliers.has(group.supplier.id) && (() => {
                          const activity = recentlyActiveSuppliers.get(group.supplier.id)!;
                          const fieldLabels: Record<string, string> = {
                            price: 'Preis', name: 'Name', sku: 'SKU', description: 'Beschreibung',
                            unit: 'Einheit', category: 'Kategorie', annual_order_value: 'Jahresumsatz'
                          };
                          const changedFieldsText = activity.changedFields.map(f => fieldLabels[f] || f).join(', ');
                          return (
                            <TooltipProvider delayDuration={0}>
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1 cursor-help p-1 -m-1 rounded hover:bg-muted/30">
                                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                                  <span className="text-xs text-muted-foreground">
                                    {activity.lastDate.toLocaleDateString('de-DE')}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="text-sm space-y-1">
                                    <p className="font-medium">Kürzlich aktiv</p>
                                    {activity.changeCount > 0 && (
                                      <p>{activity.changeCount} Änderung{activity.changeCount > 1 ? 'en' : ''}: {changedFieldsText}</p>
                                    )}
                                    {activity.suggestionCount > 0 && (
                                      <p>{activity.suggestionCount} neue Artikelvorschläge</p>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })()}
                        <span className="text-xs text-muted-foreground">({group.articles?.length || 0} Artikel)</span>
                        {pendingChangesBySupplier[group.supplier.id] > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="animate-pulse cursor-pointer gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onShowChanges?.(group.supplier.id);
                            }}
                          >
                            <Bell className="h-3 w-3" />
                            {pendingChangesBySupplier[group.supplier.id]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <Fragment>
                    {group.articles?.map((article) => {
                      return (
                        <TableRow key={article.id} className="group h-10">
                          {/* Cart Controls - Left Side */}
                          <TableCell className="py-2 w-24">
                            {onAddToCart && (() => {
                              const qty = cartItemsByArticle.get(article.id) || 0;
                              return (
                                <div className="flex items-center justify-start gap-1">
                                  {qty > 0 ? (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => onRemoveFromCart?.(article)}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="w-6 text-center font-semibold text-sm">
                                        {qty}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => onAddToCart(article)}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="default"
                                      size="icon"
                                      className="h-7 w-7 rounded-full"
                                      onClick={() => onAddToCart(article)}
                                    >
                                      <ShoppingCart className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              );
                            })()}
                          </TableCell>
                          {advancedViewEnabled && (
                            <TableCell className="py-2">
                              <Checkbox checked={selectedArticles.has(article.id)} onCheckedChange={() => onToggleArticle(article.id)} />
                            </TableCell>
                          )}
                          <TableCell className="py-2">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                                  <p 
                                                    className="font-medium text-foreground break-words line-clamp-2 cursor-pointer hover:underline hover:text-accent transition-colors"
                                                    onClick={() => onEdit(article)}
                                                  >
                                                    {toTitleCase(article.name)}
                                                  </p>
                                  {pendingArticleIds.has(article.id) && (
                                    <span 
                                      className="w-2 h-2 rounded-full bg-orange-500 animate-pulse cursor-pointer shrink-0" 
                                      title="Ausstehende Änderungen"
                                      onClick={() => onArticleChangeClick?.(article, group.supplier.id, group.supplier.name)}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="sm:hidden truncate">{article.suppliers?.name}</span>
                                  {article.category && <span className="text-primary font-medium">{article.category}</span>}
                                  {article.sku && <span className="text-muted-foreground">SKU: {article.sku}</span>}
                                  {lastOrderMap[article.id] && (
                                    <span 
                                      className="text-muted-foreground/70"
                                      title={format(new Date(lastOrderMap[article.id].date), 'dd.MM.yyyy')}
                                    >
                                      · {lastOrderMap[article.id].quantity}× {format(new Date(lastOrderMap[article.id].date), 'dd.MM.')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(article)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground py-2">
                            <p className="break-words line-clamp-2 max-w-[200px]" title={article.description || ''}>{article.description || '-'}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground py-2">{article.suppliers?.name}</TableCell>
                          {/* STÜCK/BE Spalte */}
                          <TableCell className="text-center text-muted-foreground py-2 w-20">
                            {article.packaging_unit && article.packaging_unit > 1 
                              ? `${article.packaging_unit}x` 
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium py-2">
                            <div className="flex flex-col items-end gap-0.5">
                              <div className="flex items-center justify-end gap-1">
                                <span>
                                  €{Number(article.price).toFixed(2)}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    /{article.unit}
                                  </span>
                                </span>
                                <PriceHistoryPopover articleId={article.id} articleName={article.name} />
                              </div>
                              {(() => {
                                const orderUnit = article.order_unit_id 
                                  ? orderUnits.find(u => u.id === article.order_unit_id)
                                  : null;
                                // Berechne Multiplikator: packaging_unit falls vorhanden, sonst orderUnit.quantity
                                const packagingUnit = article.packaging_unit;
                                const multiplier = packagingUnit && packagingUnit > 0 
                                  ? packagingUnit 
                                  : (orderUnit?.quantity || 1);
                                const displayUnitName = orderUnit?.name || article.unit;
                                const bePrice = Number(article.price) * multiplier;
                                
                                return (
                                  <>
                                    {multiplier > 1 && (
                                      <span className="text-sm font-semibold text-primary">
                                        €{bePrice.toFixed(2)}
                                        <span className="text-xs text-muted-foreground font-normal ml-1">
                                          /{displayUnitName}
                                        </span>
                                      </span>
                                    )}
                                    <Badge variant="outline" className="text-xs gap-1 font-normal">
                                      <Package className="h-3 w-3" />
                                      {displayUnitName}
                                    </Badge>
                                  </>
                                );
                              })()}
                              {article.reference_price && article.reference_unit && (
                                <span className="text-xs text-muted-foreground/70 italic">
                                  (€{Number(article.reference_price).toFixed(2)}/{article.reference_unit})
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </Fragment>
                </CollapsibleContent>
              </Fragment>
            </Collapsible>
          ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
});

ArticleTable.displayName = 'ArticleTable';
