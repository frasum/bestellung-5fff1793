import { Fragment } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2, FileText, Send, Bell, Store, Loader2, QrCode, ExternalLink, Key, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';
import { SupplierActivityInfo } from '@/hooks/useSupplierChanges';
import { cn } from '@/lib/utils';

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
  onShowLocations: (supplier: Supplier) => void;
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
  onShowLocations,
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
            <TableHead className="w-8"></TableHead>
            <TableHead>Lieferant</TableHead>
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
                <TableRow className="group h-14 hover:bg-muted/50">
                  {multiSelectEnabled && (
                    <TableCell className="py-2">
                      {hasArticles && <Checkbox checked={selectedSuppliers.has(supplier.id)} onCheckedChange={() => onToggleSelect(supplier.id)} />}
                    </TableCell>
                  )}
                  <TableCell className="py-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onToggleExpand(supplier.id)} disabled={supplierArticles.length === 0}>
                      {supplierArticles.length > 0 ? isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" /> : <span className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium text-foreground">{supplier.name}</p>
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
                  <TableCell className="hidden lg:table-cell py-2">
                    <Badge variant="secondary">{supplierArticles.length} Artikel</Badge>
                  </TableCell>
                  <TableCell className="text-right py-2">
                    <div className="flex justify-end gap-0.5 sm:gap-1 md:gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onShowLocations(supplier)} title="Standort-Zuordnungen">
                        <Store className="w-4 h-4" />
                      </Button>
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
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={() => onEdit(supplier)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => onDelete(supplier)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded && supplierArticles.length > 0 && (
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={multiSelectEnabled ? 5 : 4} className="p-0">
                      <div className="p-4 pl-16">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-border/50">
                              <TableHead className="h-8 text-xs">Artikel</TableHead>
                              <TableHead className="h-8 text-xs hidden md:table-cell">Beschreibung</TableHead>
                              <TableHead className="h-8 text-xs">Einheit</TableHead>
                              <TableHead className="h-8 text-xs text-right">Preis (€)</TableHead>
                              <TableHead className="h-8 text-xs text-right w-[80px]">Aktionen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {supplierArticles.map(article => {
                              return (
                                <TableRow key={article.id} className="group/article border-b border-border/30 hover:bg-muted/50">
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
                                  <TableCell className="py-1.5 text-sm">
                                    {article.unit}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-right text-sm">
                                    {Number(article.price).toFixed(2)}
                                  </TableCell>
                                  <TableCell className="py-1.5 text-right">
                                    <div className="flex justify-end gap-0.5">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          console.log('Edit article clicked:', article.id, article.name);
                                          onEditArticle(article);
                                        }}
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
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
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {onAddArticle && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => onAddArticle(supplier)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Artikel hinzufügen
                            </Button>
                          </div>
                        )}
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
