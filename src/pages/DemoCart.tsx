import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Send, CheckCircle2, Search } from 'lucide-react';
import { DemoEmailPreviewDialog, DemoEmailPreviewData } from '@/components/demo/DemoEmailPreviewDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DemoCart() {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, clearCart, cartTotal, industry, getArticles, addToCart, getSuppliers } = useDemo();
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviews, setEmailPreviews] = useState<DemoEmailPreviewData[]>([]);
  const [showAddArticleSheet, setShowAddArticleSheet] = useState(false);
  const [activeSupplierForAdd, setActiveSupplierForAdd] = useState<string | null>(null);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');

  // Build allSupplierArticles from DemoContext for all suppliers
  const allSupplierArticles = React.useMemo(() => {
    const articles = getArticles();
    const articlesBySupplier: Record<string, { articleName: string; quantity: number; unit: string; price: number }[]> = {};
    
    articles.forEach(article => {
      if (!articlesBySupplier[article.supplierId]) {
        articlesBySupplier[article.supplierId] = [];
      }
      articlesBySupplier[article.supplierId].push({
        articleName: article.name,
        quantity: 1,
        unit: article.unit,
        price: article.price,
      });
    });
    
    return articlesBySupplier;
  }, [getArticles]);

  // Group cart items by supplier
  const groupedItems = cart.reduce((acc, item) => {
    if (!acc[item.supplierId]) {
      acc[item.supplierId] = {
        supplierName: item.supplierName,
        items: [],
        total: 0,
      };
    }
    acc[item.supplierId].items.push(item);
    acc[item.supplierId].total += item.price * item.quantity;
    return acc;
  }, {} as Record<string, { supplierName: string; items: typeof cart; total: number }>);

  // Get available articles for active supplier (not already in cart)
  const availableArticlesForSupplier = useMemo(() => {
    if (!activeSupplierForAdd) return [];
    const articles = getArticles();
    const cartArticleIds = new Set(cart.map(item => item.articleId));
    return articles
      .filter(a => a.supplierId === activeSupplierForAdd && !cartArticleIds.has(a.id))
      .filter(a => 
        articleSearchQuery === '' || 
        a.name.toLowerCase().includes(articleSearchQuery.toLowerCase())
      );
  }, [activeSupplierForAdd, getArticles, cart, articleSearchQuery]);

  const handleOpenAddArticleSheet = (supplierId: string) => {
    setActiveSupplierForAdd(supplierId);
    setArticleSearchQuery('');
    setShowAddArticleSheet(true);
  };

  const handleAddArticleFromSheet = (article: ReturnType<typeof getArticles>[0]) => {
    const suppliers = getSuppliers();
    const supplier = suppliers.find(s => s.id === article.supplierId);
    if (supplier) {
      addToCart({
        articleId: article.id,
        articleName: article.name,
        supplierId: article.supplierId,
        supplierName: supplier.name,
        unit: article.unit,
        price: article.price,
      }, 1);
      toast.success(`${article.name} hinzugefügt`);
    }
  };

  const handleOpenEmailPreview = () => {
    // Generate email previews from cart (one per supplier)
    const previews: DemoEmailPreviewData[] = Object.entries(groupedItems).map(([supplierId, group]) => ({
      supplierId,
      supplierName: group.supplierName,
      supplierEmail: `bestellung@${group.supplierName.toLowerCase().replace(/\s+/g, '-')}.de`,
      deliveryAddress: 'Demo-Betrieb GmbH\nMusterstraße 1\n12345 Berlin',
      items: group.items.map(item => ({
        articleName: item.articleName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price,
      })),
      totalAmount: group.total,
      notes: '',
      confirmed: false,
    }));
    setEmailPreviews(previews);
    setShowEmailPreview(true);
  };

  const handleUpdateNotes = (supplierId: string, notes: string) => {
    setEmailPreviews(prev =>
      prev.map(p => (p.supplierId === supplierId ? { ...p, notes } : p))
    );
  };

  const handleToggleConfirm = (supplierId: string) => {
    setEmailPreviews(prev =>
      prev.map(p => (p.supplierId === supplierId ? { ...p, confirmed: !p.confirmed } : p))
    );
  };

  const handleUpdateItems = (supplierId: string, items: typeof emailPreviews[0]['items'], totalAmount: number) => {
    setEmailPreviews(prev =>
      prev.map(p => (p.supplierId === supplierId ? { ...p, items, totalAmount } : p))
    );
  };

  const handleSendOrders = async () => {
    setIsOrdering(true);
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsOrdering(false);
    setShowEmailPreview(false);
    setOrderComplete(true);
    toast.success('Demo-Bestellung erfolgreich!');
  };

  const handleNewOrder = () => {
    clearCart();
    setOrderComplete(false);
    navigate(`/demo/suppliers?industry=${industry.id}`);
  };

  if (orderComplete) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">Bestellung gesendet!</h1>
          <p className="text-muted-foreground">
            Dies ist eine Demo. In der echten Anwendung würde jetzt eine E-Mail an Ihre {industry.terminology.supplierPlural} gesendet.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(`/demo/orders?industry=${industry.id}`)}>
            Bestellungen ansehen
          </Button>
          <Button onClick={handleNewOrder}>
            Neue Bestellung
          </Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-6">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold mb-2">Warenkorb ist leer</h1>
          <p className="text-muted-foreground">
            Fügen Sie {industry.terminology.articlePlural} aus dem Katalog hinzu.
          </p>
        </div>
        <Button onClick={() => navigate(`/demo/suppliers?industry=${industry.id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zum Katalog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Warenkorb</h1>
          <p className="text-muted-foreground">
            {cart.length} {cart.length === 1 ? 'Artikel' : 'Artikel'} von {Object.keys(groupedItems).length} {industry.terminology.supplierPlural}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/demo/suppliers?industry=${industry.id}`)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Weiter einkaufen
        </Button>
      </div>

      {/* Grouped by Supplier */}
      <div className="space-y-4">
        {Object.entries(groupedItems).map(([supplierId, group]) => (
          <Card key={supplierId}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{group.supplierName}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenAddArticleSheet(supplierId)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Artikel
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map(item => (
                <div
                  key={item.articleId}
                  className="flex items-center gap-4 py-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.articleName}</p>
                    <p className="text-sm text-muted-foreground">
                      €{item.price.toFixed(2)} / {item.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartQuantity(item.articleId, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateCartQuantity(item.articleId, parseInt(e.target.value) || 0)}
                      className="w-16 text-center h-8"
                      min={1}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateCartQuantity(item.articleId, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeFromCart(item.articleId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="w-24 text-right font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-medium">
                <span>Zwischensumme</span>
                <span>€{group.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex justify-between text-lg font-bold mb-4">
            <span>Gesamtsumme</span>
            <span>€{cartTotal.toFixed(2)}</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleOpenEmailPreview}
          >
            <Send className="w-4 h-4 mr-2" />
            E-Mails prüfen & Bestellung senden
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Dies ist eine Simulation. Es werden keine echten Bestellungen gesendet.
          </p>
        </CardContent>
      </Card>

      {/* Email Preview Dialog */}
      <DemoEmailPreviewDialog
        open={showEmailPreview}
        onOpenChange={setShowEmailPreview}
        emailPreviews={emailPreviews}
        onUpdateNotes={handleUpdateNotes}
        onToggleConfirm={handleToggleConfirm}
        onSendOrders={handleSendOrders}
        isOrdering={isOrdering}
        industry={industry}
        onUpdateItems={handleUpdateItems}
        allSupplierArticles={allSupplierArticles}
      />

      {/* Add Article Sheet */}
      <Sheet open={showAddArticleSheet} onOpenChange={setShowAddArticleSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Artikel hinzufügen</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={articleSearchQuery}
                onChange={(e) => setArticleSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2 pr-4">
                {availableArticlesForSupplier.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Keine weiteren Artikel verfügbar
                  </p>
                ) : (
                  availableArticlesForSupplier.map(article => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{article.name}</p>
                        <p className="text-sm text-muted-foreground">
                          €{article.price.toFixed(2)} / {article.unit}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddArticleFromSheet(article)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Hinzufügen
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
