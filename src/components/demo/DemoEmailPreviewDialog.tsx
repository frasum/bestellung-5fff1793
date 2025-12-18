import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  CheckCircle2, 
  Send, 
  Building2, 
  MapPin, 
  Plus, 
  Minus, 
  Trash2, 
  PlusCircle, 
  Search,
  Package
} from 'lucide-react';

export interface DemoEmailPreviewItem {
  articleName: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface DemoEmailPreviewData {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  deliveryAddress: string;
  items: DemoEmailPreviewItem[];
  totalAmount: number;
  notes: string;
  confirmed: boolean;
}

interface DemoEmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailPreviews: DemoEmailPreviewData[];
  onUpdateNotes: (supplierId: string, notes: string) => void;
  onToggleConfirm: (supplierId: string) => void;
  onSendOrders: () => void;
  isOrdering: boolean;
  industry: {
    terminology: {
      supplier: string;
      supplierPlural: string;
    };
  };
  onUpdateItems?: (supplierId: string, items: DemoEmailPreviewItem[], totalAmount: number) => void;
  allSupplierArticles?: Record<string, DemoEmailPreviewItem[]>;
}

export function DemoEmailPreviewDialog({
  open,
  onOpenChange,
  emailPreviews,
  onUpdateNotes,
  onToggleConfirm,
  onSendOrders,
  isOrdering,
  industry,
  onUpdateItems,
  allSupplierArticles,
}: DemoEmailPreviewDialogProps) {
  const [showAddArticleSheet, setShowAddArticleSheet] = useState(false);
  const [activeSupplierForAdd, setActiveSupplierForAdd] = useState<string | null>(null);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [localPreviews, setLocalPreviews] = useState<DemoEmailPreviewData[]>([]);

  // Sync local state with props ONLY when dialog opens (not on emailPreviews changes)
  useEffect(() => {
    if (open) {
      setLocalPreviews(emailPreviews);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Use local state
  const currentPreviews = localPreviews.length > 0 ? localPreviews : emailPreviews;

  // Handle local toggle confirmation
  const handleLocalToggleConfirm = (supplierId: string) => {
    setLocalPreviews(prev => {
      const updated = prev.length > 0 ? [...prev] : [...emailPreviews];
      return updated.map(p => 
        p.supplierId === supplierId ? { ...p, confirmed: !p.confirmed } : p
      );
    });
  };

  const allConfirmed = currentPreviews.every(preview => preview.confirmed);
  const confirmedCount = currentPreviews.filter(preview => preview.confirmed).length;

  // Collect all unique articles from all suppliers for adding
  const allAvailableArticles = useMemo(() => {
    const articlesMap = new Map<string, DemoEmailPreviewItem & { supplierName: string }>();
    currentPreviews.forEach(preview => {
      preview.items.forEach(item => {
        const key = `${item.articleName}-${item.unit}`;
        if (!articlesMap.has(key)) {
          articlesMap.set(key, { ...item, supplierName: preview.supplierName });
        }
      });
    });
    return Array.from(articlesMap.values());
  }, [currentPreviews]);

  // Get articles available to add (from full supplier catalog, not already in current email)
  const getAvailableArticlesToAdd = (supplierId: string) => {
    const currentPreview = currentPreviews.find(p => p.supplierId === supplierId);
    if (!currentPreview) return [];

    // Use full supplier articles if available, otherwise fall back to collected articles
    const supplierArticles = allSupplierArticles?.[supplierId] || 
      allAvailableArticles.filter(a => {
        const preview = currentPreviews.find(p => p.supplierId === supplierId);
        return preview?.supplierName === a.supplierName;
      });

    const currentArticleNames = new Set(currentPreview.items.map(item => item.articleName));
    return supplierArticles.filter(article => !currentArticleNames.has(article.articleName));
  };

  const filteredArticlesToAdd = useMemo(() => {
    if (!activeSupplierForAdd) return [];
    const available = getAvailableArticlesToAdd(activeSupplierForAdd);
    if (!articleSearchQuery) return available;
    return available.filter(article =>
      article.articleName.toLowerCase().includes(articleSearchQuery.toLowerCase())
    );
  }, [activeSupplierForAdd, articleSearchQuery, currentPreviews]);

  const updateItemQuantity = (supplierId: string, itemIndex: number, newQuantity: number) => {
    setLocalPreviews(prev => {
      const updated = prev.length > 0 ? [...prev] : [...emailPreviews];
      const previewIndex = updated.findIndex(p => p.supplierId === supplierId);
      if (previewIndex === -1) return prev;

      const preview = { ...updated[previewIndex] };
      const items = [...preview.items];

      if (newQuantity <= 0) {
        items.splice(itemIndex, 1);
      } else {
        items[itemIndex] = { ...items[itemIndex], quantity: newQuantity };
      }

      preview.items = items;
      preview.totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      updated[previewIndex] = preview;

      if (onUpdateItems) {
        onUpdateItems(supplierId, preview.items, preview.totalAmount);
      }

      return updated;
    });
  };

  const removeItem = (supplierId: string, itemIndex: number) => {
    updateItemQuantity(supplierId, itemIndex, 0);
  };

  const addArticleToEmail = (supplierId: string, article: DemoEmailPreviewItem) => {
    setLocalPreviews(prev => {
      const updated = prev.length > 0 ? [...prev] : [...emailPreviews];
      const previewIndex = updated.findIndex(p => p.supplierId === supplierId);
      if (previewIndex === -1) return prev;

      const preview = { ...updated[previewIndex] };
      const newItem: DemoEmailPreviewItem = {
        articleName: article.articleName,
        quantity: 1,
        unit: article.unit,
        price: article.price,
      };
      preview.items = [...preview.items, newItem];
      preview.totalAmount = preview.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      updated[previewIndex] = preview;

      if (onUpdateItems) {
        onUpdateItems(supplierId, preview.items, preview.totalAmount);
      }

      return updated;
    });

    setShowAddArticleSheet(false);
    setArticleSearchQuery('');
  };

  const openAddArticleSheet = (supplierId: string) => {
    setActiveSupplierForAdd(supplierId);
    setArticleSearchQuery('');
    setShowAddArticleSheet(true);
  };

  // Reset local state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLocalPreviews([]);
    } else {
      setLocalPreviews(emailPreviews);
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              E-Mail-Vorschau ({confirmedCount}/{currentPreviews.length} bestätigt)
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Bitte kontrollieren Sie die E-Mails an Ihre {industry.terminology.supplierPlural} und bestätigen Sie jede einzeln.
            </p>

            {currentPreviews.map((preview) => (
              <Card 
                key={preview.supplierId} 
                className={`transition-all ${preview.confirmed ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {preview.supplierName}
                    </CardTitle>
                    {preview.confirmed && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Bestätigt
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {preview.supplierEmail}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email Preview Content */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <div className="font-medium">
                      Betreff: Bestellung von Demo-Betrieb GmbH
                    </div>
                    <Separator />
                    <div>
                      <p>Sehr geehrte Damen und Herren,</p>
                      <p className="mt-2">hiermit bestellen wir folgende Artikel:</p>
                    </div>

                    {/* Interactive Items Table */}
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2">Artikel</th>
                            <th className="text-center p-2">Menge</th>
                            <th className="text-right p-2">Preis</th>
                            <th className="w-10 p-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.items.map((item, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{item.articleName}</td>
                              <td className="p-2">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateItemQuantity(preview.supplierId, i, item.quantity - 1)}
                                    disabled={preview.confirmed}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(preview.supplierId, i, parseInt(e.target.value) || 0)}
                                    className="w-14 h-6 text-center text-xs px-1"
                                    min={1}
                                    disabled={preview.confirmed}
                                  />
                                  <span className="text-xs text-muted-foreground w-8">{item.unit}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => updateItemQuantity(preview.supplierId, i, item.quantity + 1)}
                                    disabled={preview.confirmed}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                              <td className="text-right p-2">€{(item.price * item.quantity).toFixed(2)}</td>
                              <td className="p-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => removeItem(preview.supplierId, i)}
                                  disabled={preview.confirmed}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t font-medium bg-muted/50">
                            <td className="p-2" colSpan={2}>Gesamtsumme</td>
                            <td className="text-right p-2">€{preview.totalAmount.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Add Article Button */}
                    {!preview.confirmed && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => openAddArticleSheet(preview.supplierId)}
                      >
                        <PlusCircle className="w-4 h-4" />
                        Artikel hinzufügen
                      </Button>
                    )}

                    {/* Delivery Address */}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Lieferadresse:</span>
                        <pre className="text-xs mt-1 whitespace-pre-wrap">{preview.deliveryAddress}</pre>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Notizen an {preview.supplierName}:
                    </label>
                    <Textarea
                      placeholder="Optional: Zusätzliche Hinweise für diese Bestellung..."
                      value={preview.notes}
                      onChange={(e) => onUpdateNotes(preview.supplierId, e.target.value)}
                      rows={2}
                      disabled={preview.confirmed}
                    />
                  </div>

                  {/* Confirmation Checkbox */}
                  <div 
                    className="flex items-center space-x-2 pt-2 cursor-pointer"
                    onClick={() => handleLocalToggleConfirm(preview.supplierId)}
                  >
                    <Checkbox
                      id={`confirm-${preview.supplierId}`}
                      checked={preview.confirmed}
                      onCheckedChange={() => handleLocalToggleConfirm(preview.supplierId)}
                    />
                    <label
                      htmlFor={`confirm-${preview.supplierId}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      E-Mail an {preview.supplierName} bestätigen
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isOrdering}>
              Abbrechen
            </Button>
            <Button
              onClick={onSendOrders}
              disabled={!allConfirmed || isOrdering}
              className="gap-2"
            >
              {isOrdering ? (
                'Wird gesendet...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {currentPreviews.length} {currentPreviews.length === 1 ? 'E-Mail' : 'E-Mails'} senden
                </>
              )}
            </Button>
          </DialogFooter>

          {!allConfirmed && (
            <p className="text-xs text-muted-foreground text-center">
              Bitte bestätigen Sie alle E-Mails, bevor Sie die Demo-Bestellungen senden.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Article Sheet */}
      <Sheet open={showAddArticleSheet} onOpenChange={setShowAddArticleSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              Artikel hinzufügen
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={articleSearchQuery}
                onChange={(e) => setArticleSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Available Articles List */}
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 pr-4">
                {filteredArticlesToAdd.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {articleSearchQuery 
                        ? 'Keine Artikel gefunden' 
                        : 'Keine weiteren Artikel verfügbar'}
                    </p>
                  </div>
                ) : (
                  filteredArticlesToAdd.map((article, index) => (
                    <div
                      key={`${article.articleName}-${index}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{article.articleName}</p>
                        <p className="text-sm text-muted-foreground">
                          €{article.price.toFixed(2)} / {article.unit}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-primary hover:text-primary"
                        onClick={() => activeSupplierForAdd && addArticleToEmail(activeSupplierForAdd, article)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
