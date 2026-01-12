import { Fragment } from 'react';
import { Trash2, FileText, Send, Bell, Loader2, QrCode, ExternalLink, Key, Plus, ShoppingCart, Minus, Calendar, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';
import { SupplierActivityInfo } from '@/hooks/useSupplierChanges';
import { LastOrderInfo } from '@/hooks/useLastOrderByArticle';
import { cn, toTitleCase } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SupplierTableProps {
  suppliers: Supplier[];
  articlesBySupplier: Record<string, Article[]>;
  expandedSuppliers: Set<string>;
  selectedSuppliers: Set<string>;
  multiSelectEnabled: boolean;
  pendingChangesBySupplier: Record<string, number>;
  pendingArticleIds?: Set<string>;
  recentlyActiveSuppliers?: Map<string, SupplierActivityInfo>;
  advancedSettingsEnabled?: boolean;
  cartItemCountsBySupplier?: Record<string, number>;
  cartItemsByArticle?: Map<string, number>;
  highlightSearch?: string;
  lastOrderByArticle?: Record<string, LastOrderInfo>;
  onToggleExpand: (supplierId: string) => void;
  onToggleSelect: (supplierId: string) => void;
  onSelectAll: () => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onSendInvitation: (supplier: Supplier) => void;
  onShowQRCode: (supplier: Supplier) => void;
  onShowTokens?: (supplier: Supplier) => void;
  onOpenPortal?: (supplier: Supplier) => void;
  onShowChanges: (supplier: Supplier) => void;
  onOrderClick?: (supplier: Supplier) => void;
  onAddToCart?: (article: Article) => void;
  onRemoveFromCart?: (article: Article) => void;
  
  onPrintOrderList: (supplier: Supplier, articles: Article[]) => void;
  onArticleChangeClick?: (article: Article, supplier: Supplier) => void;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (article: Article) => void;
  onAddArticle?: (supplier: Supplier) => void;
  invitingSupplierId: string | null;
  sendingInvitation: boolean;
}

export const SupplierTable = ({
  suppliers,
  articlesBySupplier,
  expandedSuppliers,
  selectedSuppliers,
  multiSelectEnabled,
  pendingChangesBySupplier,
  pendingArticleIds = new Set(),
  recentlyActiveSuppliers = new Map(),
  advancedSettingsEnabled = false,
  cartItemCountsBySupplier = {},
  cartItemsByArticle = new Map(),
  highlightSearch = '',
  lastOrderByArticle = {},
  onToggleExpand,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onSendInvitation,
  onShowQRCode,
  onShowTokens,
  onOpenPortal,
  onShowChanges,
  onOrderClick,
  onAddToCart,
  onRemoveFromCart,
  onPrintOrderList,
  onArticleChangeClick,
  onEditArticle,
  onDeleteArticle,
  onAddArticle,
  invitingSupplierId,
  sendingInvitation
}: SupplierTableProps) => {
  const suppliersWithArticles = suppliers?.filter(s => (articlesBySupplier[s.id]?.length || 0) > 0) || [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border">
            {multiSelectEnabled && (
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedSuppliers.size > 0 && selectedSuppliers.size === suppliersWithArticles.length} 
                  onCheckedChange={onSelectAll} 
                />
              </TableHead>
            )}
            
            <TableHead className="w-12"></TableHead>
            <TableHead className="hidden lg:table-cell w-24">Artikel</TableHead>
            <TableHead>Lieferant</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers?.map(supplier => {
            const supplierArticles = articlesBySupplier[supplier.id] || [];
            const isExpanded = expandedSuppliers.has(supplier.id);
            const hasArticles = supplierArticles.length > 0;
            return (
              <Fragment key={supplier.id}>
                <TableRow className="group h-14 hover:bg-muted/50">
                  {multiSelectEnabled && (
                    <TableCell className="py-2">
                      {hasArticles && <Checkbox checked={selectedSuppliers.has(supplier.id)} onCheckedChange={() => onToggleSelect(supplier.id)} />}
                    </TableCell>
                  )}
                  {/* Cart Button - First column */}
                  <TableCell className="py-2">
                    {onOrderClick && supplierArticles.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-9 w-9 relative rounded-full text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => onOrderClick(supplier)}
                        title="Artikel bestellen"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {cartItemCountsBySupplier[supplier.id] > 0 && (
                          <Badge variant="secondary" className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 text-xs">
                            {cartItemCountsBySupplier[supplier.id]}
                          </Badge>
                        )}
                      </Button>
                    )}
                  </TableCell>
                  {/* Article count - Second column */}
                  <TableCell className="hidden lg:table-cell py-2 w-24">
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:scale-105 transition-all px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(supplier.id);
                      }}
                    >
                      {supplierArticles.length}
                    </Badge>
                  </TableCell>
                  {/* Supplier name - Third column */}
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p 
                          className="font-medium text-foreground cursor-pointer hover:underline hover:text-accent transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(supplier);
                          }}
                        >
                          {supplier.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{supplier.phone || '-'}</p>
                      </div>
                      {recentlyActiveSuppliers.has(supplier.id) && (() => {
                        const activity = recentlyActiveSuppliers.get(supplier.id)!;
                        const fieldLabels: Record<string, string> = {
                          price: 'Preis', name: 'Name', sku: 'SKU', description: 'Beschreibung',
                          unit: 'Einheit', category: 'Kategorie', annual_order_value: 'Jahresumsatz'
                        };
                        const changedFieldsText = activity.changedFields.map(f => fieldLabels[f] || f).join(', ');
                        return (
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1.5 cursor-help p-1 -m-1 rounded hover:bg-muted/30">
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
                      {pendingChangesBySupplier[supplier.id] > 0 && (
                        <Badge variant="destructive" className="cursor-pointer animate-pulse" onClick={() => onShowChanges(supplier)}>
                          <Bell className="w-3 h-3 mr-1" />
                          {pendingChangesBySupplier[supplier.id]}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex justify-end items-center gap-0.5 sm:gap-1 md:gap-1.5">
                      {/* Secondary actions - visible on hover */}
                      <div className="flex gap-0.5 sm:gap-1 md:gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onSendInvitation(supplier)} disabled={invitingSupplierId === supplier.id || sendingInvitation} title="Einladung zum Lieferantenportal senden">
                        {invitingSupplierId === supplier.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onShowQRCode(supplier)} title="QR-Code für Lieferantenportal">
                        <QrCode className="w-4 h-4" />
                      </Button>
                      {advancedSettingsEnabled && onShowTokens && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onShowTokens(supplier)} title="Tokens verwalten">
                          <Key className="w-4 h-4" />
                        </Button>
                      )}
                      {advancedSettingsEnabled && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onOpenPortal?.(supplier)} title="Portal direkt öffnen (Test)">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                      {supplierArticles.length > 0 && (
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onPrintOrderList(supplier, supplierArticles)} title="Bestellliste drucken">
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                      {onAddArticle && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-9 w-9 text-muted-foreground hover:text-foreground" 
                          onClick={() => onAddArticle(supplier)}
                          title="Artikel hinzufügen"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => onDelete(supplier)} title="Löschen">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && supplierArticles.length > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={multiSelectEnabled ? 6 : 5} className="p-0">
                      <div className="p-4 pl-16">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border/50">
                              <TableHead className="h-8 text-xs text-center w-[120px]">Bestellen</TableHead>
                              <TableHead className="h-8 text-xs">Artikel</TableHead>
                              <TableHead className="h-8 text-xs hidden md:table-cell">Beschreibung</TableHead>
                              <TableHead className="h-8 text-xs">Einheit</TableHead>
                              <TableHead className="h-8 text-xs text-center">Stück/BE</TableHead>
                              <TableHead className="h-8 text-xs text-right">Preis (€)</TableHead>
                              <TableHead className="h-8 text-xs text-right w-[60px]"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplierArticles.map(article => {
                              const isHighlighted = highlightSearch && (
                                article.name.toLowerCase().includes(highlightSearch.toLowerCase()) ||
                                article.sku?.toLowerCase().includes(highlightSearch.toLowerCase())
                              );
                              return (
                                <TableRow key={article.id} className={cn(
                                  "group/article border-b border-border/30 hover:bg-muted/50",
                                  isHighlighted && "bg-accent/20 ring-1 ring-accent/50"
                                )}>
                                  {/* Cart Controls - Left Side */}
                                  <TableCell className="py-1.5">
                                    {onAddToCart && (() => {
                                      const qty = cartItemsByArticle.get(article.id) || 0;
                                      return (
                                        <div className="flex items-center justify-center gap-1">
                                          {qty > 0 ? (
                                            <>
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onRemoveFromCart?.(article);
                                                }}
                                              >
                                                <Minus className="w-3 h-3" />
                                              </Button>
                                              <span className="w-8 text-center font-semibold text-sm">
                                                {qty}
                                              </span>
                                              <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onAddToCart(article);
                                                }}
                                              >
                                                <Plus className="w-3 h-3" />
                                              </Button>
                                            </>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              className="h-7 w-7 rounded-full text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                onAddToCart(article);
                                              }}
                                            >
                                              <ShoppingCart className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                  <TableCell className="py-1.5">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        <p 
                                          className="text-sm font-medium cursor-pointer hover:underline hover:text-accent transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onEditArticle(article);
                                          }}
                                        >
                                          {toTitleCase(article.name)}
                                        </p>
                                        {pendingArticleIds.has(article.id) && (
                                          <span
                                            className="w-2 h-2 rounded-full bg-orange-500 animate-pulse cursor-pointer" 
                                            title="Ausstehende Änderungen"
                                            onClick={() => onArticleChangeClick?.(article, supplier)}
                                          />
                                        )}
                                      </div>
                                      {/* Letzte Bestellung inline */}
                                      {lastOrderByArticle?.[article.id] && (
                                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                          <span className="flex items-center gap-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(lastOrderByArticle[article.id].date), 'dd.MM.', { locale: de })}
                                          </span>
                                          <span className="flex items-center gap-0.5">
                                            <User className="w-3 h-3" />
                                            {lastOrderByArticle[article.id].orderedBy}
                                          </span>
                                          <span className="flex items-center gap-0.5">
                                            <Package className="w-3 h-3" />
                                            {lastOrderByArticle[article.id].quantity} {article.unit}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-1.5 hidden md:table-cell">
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={toTitleCase(article.description || '') || ''}>
                                      {toTitleCase(article.description || '') || '-'}
                                    </p>
                                  </TableCell>
                                  <TableCell className="py-1.5 text-sm">
                                    {article.unit}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-center text-sm text-muted-foreground">
                                    {article.packaging_unit && article.packaging_unit > 1 
                                      ? `${article.packaging_unit}x` 
                                      : '-'}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-right text-sm">
                                    {Number(article.price).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-right">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-7 w-7 text-destructive hover:text-destructive" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteArticle(article);
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
