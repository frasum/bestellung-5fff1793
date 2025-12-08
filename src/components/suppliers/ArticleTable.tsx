import { Fragment } from 'react';
import { ChevronRight, Pencil, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PriceHistoryPopover } from '@/components/suppliers/PriceHistoryPopover';
import { ArticleCard } from '@/components/suppliers/ArticleCard';
import { Article } from '@/hooks/useArticles';
import { cn } from '@/lib/utils';

interface ArticleGroup {
  supplier: { id: string; name: string };
  articles: Article[] | undefined;
}

interface ArticleTableProps {
  groupedBySupplier: ArticleGroup[];
  openSuppliers: Set<string>;
  selectedArticles: Set<string>;
  advancedViewEnabled: boolean;
  getCartQuantity: (articleId: string) => number;
  getItemsBySupplier: () => Map<string, unknown>;
  onToggleSupplier: (supplierId: string) => void;
  onToggleArticle: (articleId: string) => void;
  onAddToCart: (article: Article, quantity: number) => void;
  onUpdateQuantity: (articleId: string, quantity: number) => void;
  onEdit: (article: Article) => void;
  onDelete: (article: Article) => void;
}

export const ArticleTable = ({
  groupedBySupplier,
  openSuppliers,
  selectedArticles,
  advancedViewEnabled,
  getCartQuantity,
  getItemsBySupplier,
  onToggleSupplier,
  onToggleArticle,
  onAddToCart,
  onUpdateQuantity,
  onEdit,
  onDelete
}: ArticleTableProps) => {
  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {groupedBySupplier.map((group) => (
          <Collapsible 
            key={group.supplier.id} 
            open={openSuppliers.has(group.supplier.id)} 
            onOpenChange={() => onToggleSupplier(group.supplier.id)}
          >
            <CollapsibleTrigger className="w-full">
              <div className={cn(
                "flex items-center justify-between p-4 rounded-lg bg-card border border-border",
                getItemsBySupplier().has(group.supplier.id) && "bg-destructive/10 border-destructive/30"
              )}>
                <div className="flex items-center gap-2">
                  <ChevronRight className={cn(
                    "h-5 w-5 transition-transform text-muted-foreground",
                    openSuppliers.has(group.supplier.id) && "rotate-90"
                  )} />
                  <span className={cn(
                    "font-semibold",
                    getItemsBySupplier().has(group.supplier.id) ? "text-destructive" : "text-foreground"
                  )}>
                    {group.supplier.name}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {group.articles?.length || 0} Artikel
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-3 pt-3">
                {group.articles?.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    cartQty={getCartQuantity(article.id)}
                    onUpdateQuantity={onUpdateQuantity}
                    onAddToCart={onAddToCart}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableBody>
          {groupedBySupplier.map((group) => (
            <Collapsible key={group.supplier.id} open={openSuppliers.has(group.supplier.id)} onOpenChange={() => onToggleSupplier(group.supplier.id)} asChild>
              <Fragment>
                <CollapsibleTrigger asChild>
                  <TableRow className={cn(
                    "bg-muted/50 cursor-pointer",
                    getItemsBySupplier().has(group.supplier.id) && "bg-destructive/20"
                  )}>
                    <TableCell colSpan={advancedViewEnabled ? 6 : 5} className="py-2 px-4">
                      <div className="flex items-center gap-2">
                        <ChevronRight className={cn("h-4 w-4 transition-transform", openSuppliers.has(group.supplier.id) && "rotate-90")} />
                        <span className={cn(
                          "font-semibold text-sm",
                          getItemsBySupplier().has(group.supplier.id) ? "text-destructive" : "text-foreground"
                        )}>{group.supplier.name}</span>
                        <span className="text-xs text-muted-foreground">({group.articles?.length || 0} Artikel)</span>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <Fragment>
                    {group.articles?.map((article) => {
                      const cartQty = getCartQuantity(article.id);
                      return (
                        <TableRow key={article.id} className={cn("group h-10", cartQty > 0 && "bg-destructive/10")}>
                          {advancedViewEnabled && (
                            <TableCell className="py-2">
                              <Checkbox checked={selectedArticles.has(article.id)} onCheckedChange={() => onToggleArticle(article.id)} />
                            </TableCell>
                          )}
                          <TableCell className="py-2">
                            <div className="flex items-center justify-center gap-1">
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onUpdateQuantity(article.id, cartQty - 1)} disabled={cartQty === 0}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={cartQty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val >= 0) {
                                    onUpdateQuantity(article.id, val);
                                  } else if (e.target.value === '') {
                                    onUpdateQuantity(article.id, 0);
                                  }
                                }}
                                onFocus={(e) => {
                                  const target = e.target;
                                  setTimeout(() => target.select(), 0);
                                }}
                                className={cn(
                                  "w-12 h-8 text-center font-medium rounded-md border border-input bg-background",
                                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                  cartQty > 0 ? "text-destructive" : "text-foreground"
                                )}
                              />
                              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onAddToCart(article, 1)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate">{article.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="sm:hidden truncate">{article.suppliers?.name}</span>
                                  {article.category && <span className="text-primary font-medium">{article.category}</span>}
                                  {article.sku && <span className="text-muted-foreground">SKU: {article.sku}</span>}
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(article)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(article)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground py-2">
                            <p className="truncate max-w-[200px]" title={article.description || ''}>{article.description || '-'}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground py-2">{article.suppliers?.name}</TableCell>
                          <TableCell className="text-right font-medium py-2">
                            <div className="flex items-center justify-end gap-1">
                              <span>
                                €{Number(article.price).toFixed(2)}
                                <span className="text-xs text-muted-foreground ml-1">/{article.unit}</span>
                              </span>
                              <PriceHistoryPopover articleId={article.id} articleName={article.name} />
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
};
