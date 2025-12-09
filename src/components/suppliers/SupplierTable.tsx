import { Fragment } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, FileText, Send, Bell, Store, Loader2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';
import { cn } from '@/lib/utils';

interface SupplierTableProps {
  suppliers: Supplier[];
  articlesBySupplier: Record<string, Article[]>;
  expandedSuppliers: Set<string>;
  selectedSuppliers: Set<string>;
  multiSelectEnabled: boolean;
  pendingChangesBySupplier: Record<string, number>;
  pendingArticleIds?: Set<string>;
  recentlyActiveSuppliers?: Set<string>;
  onToggleExpand: (supplierId: string) => void;
  onToggleSelect: (supplierId: string) => void;
  onSelectAll: () => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onSendInvitation: (supplier: Supplier) => void;
  onShowChanges: (supplier: Supplier) => void;
  onShowLocations: (supplier: Supplier) => void;
  onPrintOrderList: (supplier: Supplier, articles: Article[]) => void;
  onArticleChangeClick?: (article: Article, supplier: Supplier) => void;
  invitingSupplierId: string | null;
  sendingInvitation: boolean;
  getCartQuantity: (articleId: string) => number;
  onAddToCart: (article: Article, quantity: number) => void;
  onUpdateQuantity: (articleId: string, quantity: number) => void;
}

export const SupplierTable = ({
  suppliers,
  articlesBySupplier,
  expandedSuppliers,
  selectedSuppliers,
  multiSelectEnabled,
  pendingChangesBySupplier,
  pendingArticleIds = new Set(),
  recentlyActiveSuppliers = new Set(),
  onToggleExpand,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
  onSendInvitation,
  onShowChanges,
  onShowLocations,
  onPrintOrderList,
  onArticleChangeClick,
  invitingSupplierId,
  sendingInvitation,
  getCartQuantity,
  onAddToCart,
  onUpdateQuantity
}: SupplierTableProps) => {
  const suppliersWithArticles = suppliers?.filter(s => (articlesBySupplier[s.id]?.length || 0) > 0) || [];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {multiSelectEnabled && (
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedSuppliers.size > 0 && selectedSuppliers.size === suppliersWithArticles.length} 
                  onCheckedChange={onSelectAll} 
                />
              </TableHead>
            )}
            <TableHead className="w-8"></TableHead>
            <TableHead>Lieferant</TableHead>
            <TableHead className="hidden md:table-cell">Kategorie</TableHead>
            <TableHead className="hidden lg:table-cell">Artikel</TableHead>
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
                <TableRow className="group">
                  {multiSelectEnabled && (
                    <TableCell className="py-2">
                      {hasArticles && <Checkbox checked={selectedSuppliers.has(supplier.id)} onCheckedChange={() => onToggleSelect(supplier.id)} />}
                    </TableCell>
                  )}
                  <TableCell className="py-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleExpand(supplier.id)} disabled={supplierArticles.length === 0}>
                      {supplierArticles.length > 0 ? isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" /> : <span className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-foreground">{supplier.name}</p>
                        <p className="text-xs text-muted-foreground">{supplier.phone || '-'}</p>
                      </div>
                      {recentlyActiveSuppliers.has(supplier.id) && (
                        <span 
                          className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" 
                          title="Kürzlich aktiv - Änderungen eingereicht in den letzten 4 Monaten"
                        />
                      )}
                      {pendingChangesBySupplier[supplier.id] > 0 && (
                        <Badge variant="destructive" className="cursor-pointer animate-pulse" onClick={() => onShowChanges(supplier)}>
                          <Bell className="w-3 h-3 mr-1" />
                          {pendingChangesBySupplier[supplier.id]}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground py-2">
                    <p className="text-sm text-primary font-medium">
                      {supplier.top_category && supplier.main_category ? `${supplier.top_category} › ${supplier.main_category}` : supplier.top_category || supplier.main_category || '-'}
                    </p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-2">
                    <Badge variant="secondary">{supplierArticles.length} Artikel</Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex justify-end gap-1 md:gap-1.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9 text-muted-foreground hover:text-primary" onClick={() => onShowLocations(supplier)} title="Standort-Zuordnungen">
                        <Store className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9 text-muted-foreground hover:text-primary" onClick={() => onSendInvitation(supplier)} disabled={invitingSupplierId === supplier.id || sendingInvitation} title="Einladung zum Lieferantenportal senden">
                        {invitingSupplierId === supplier.id ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Send className="w-3 h-3 md:w-4 md:h-4" />}
                      </Button>
                      {supplierArticles.length > 0 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9 text-muted-foreground hover:text-primary" onClick={() => onPrintOrderList(supplier, supplierArticles)} title="Bestellliste drucken">
                          <FileText className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9" onClick={() => onEdit(supplier)}>
                        <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 md:h-9 md:w-9 text-destructive hover:text-destructive" onClick={() => onDelete(supplier)}>
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && supplierArticles.length > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-4 pl-16">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border/50">
                              <TableHead className="h-8 text-xs text-center w-[80px]">Menge</TableHead>
                              <TableHead className="h-8 text-xs">Artikel</TableHead>
                              <TableHead className="h-8 text-xs hidden md:table-cell">Beschreibung</TableHead>
                              <TableHead className="h-8 text-xs text-right">Preis</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplierArticles.map(article => {
                              const cartQty = getCartQuantity(article.id);
                              return (
                                <TableRow key={article.id} className={`border-b border-border/30 hover:bg-muted/50 ${cartQty > 0 ? 'bg-destructive/10 text-destructive' : ''}`}>
                                  <TableCell className="py-1.5">
                                    <div className="flex items-center justify-center gap-1 md:gap-1.5">
                                      <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="h-8 w-8 md:h-10 md:w-10" 
                                        onClick={() => onUpdateQuantity(article.id, cartQty - 1)} 
                                        disabled={cartQty === 0}
                                      >
                                        <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                      </Button>
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={cartQty || ''}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value) || 0;
                                          if (val === 0) {
                                            onUpdateQuantity(article.id, 0);
                                          } else if (cartQty === 0) {
                                            onAddToCart(article, val);
                                          } else {
                                            onUpdateQuantity(article.id, val);
                                          }
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        className={cn("w-12 h-8 md:w-14 md:h-10 text-center text-sm md:text-base", cartQty > 0 && "border-destructive bg-destructive/10 text-destructive font-medium")}
                                        placeholder="0"
                                      />
                                      <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="h-8 w-8 md:h-10 md:w-10" 
                                        onClick={() => cartQty === 0 ? onAddToCart(article, 1) : onUpdateQuantity(article.id, cartQty + 1)}
                                      >
                                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-1.5">
                                    <div className="flex items-center gap-2">
                                      <p 
                                        className={cn(
                                          "text-sm font-medium",
                                          pendingArticleIds.has(article.id) && "cursor-pointer hover:underline"
                                        )}
                                        onClick={() => pendingArticleIds.has(article.id) && onArticleChangeClick?.(article, supplier)}
                                      >
                                        {article.name}
                                      </p>
                                      {pendingArticleIds.has(article.id) && (
                                        <span 
                                          className="w-2 h-2 rounded-full bg-orange-500 animate-pulse cursor-pointer" 
                                          title="Ausstehende Änderungen"
                                          onClick={() => onArticleChangeClick?.(article, supplier)}
                                        />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-1.5 hidden md:table-cell">
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={article.description || ''}>
                                      {article.description || '-'}
                                    </p>
                                  </TableCell>
                                  <TableCell className="py-1.5 text-right text-sm">
                                    €{Number(article.price).toFixed(2)}
                                    <span className="text-xs text-muted-foreground ml-1">/{article.unit}</span>
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
