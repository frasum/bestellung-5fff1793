import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, ShoppingCart, LogOut, Package, Search, Plus, Minus, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

interface Article {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  unit: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  supplier_account_id: string;
}

interface CartItem {
  articleId: string;
  name: string;
  quantity: number;
  price: number;
  unit: string;
}

interface CustomerInfo {
  id: string;
  companyName: string;
  supplierAccountId: string;
  supplierName: string;
  supplierSubdomain?: string | null;
  deliveryAddress?: string | null;
}

type ViewState = 'catalog' | 'checkout' | 'confirmation';

export default function B2BCustomerPortal() {
  const navigate = useNavigate();
  const { subdomain } = useParams<{ subdomain?: string }>();

  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Checkout state
  const [viewState, setViewState] = useState<ViewState>('catalog');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    void checkAuthAndLoadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthAndLoadData = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setNeedsLogin(true);
        setCustomerInfo(null);
        return;
      }

      const { data: customer, error: custError } = await supabase
        .from('supplier_b2b_customers')
        .select(`
          id,
          company_name,
          supplier_account_id,
          delivery_address,
          supplier_b2b_accounts!inner(company_name, subdomain)
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (custError || !customer) {
        setCustomerInfo(null);
        setNeedsLogin(true);
        return;
      }

      const supplierName = (customer.supplier_b2b_accounts as any)?.company_name as string;
      const supplierSubdomain = (customer.supplier_b2b_accounts as any)?.subdomain as string | null | undefined;

      // If the URL contains a subdomain, ensure this user belongs to that portal
      if (subdomain && supplierSubdomain && subdomain !== supplierSubdomain) {
        toast.error(`Dieser Login gehört nicht zu „${subdomain}".`);
        await supabase.auth.signOut();
        setCustomerInfo(null);
        setNeedsLogin(true);
        return;
      }

      setCustomerInfo({
        id: customer.id,
        companyName: customer.company_name,
        supplierAccountId: customer.supplier_account_id,
        supplierName,
        supplierSubdomain,
        deliveryAddress: customer.delivery_address,
      });

      // Pre-fill delivery address
      if (customer.delivery_address) {
        setDeliveryAddress(customer.delivery_address);
      }

      const { data: articlesData, error: artError } = await supabase
        .from('supplier_b2b_articles')
        .select('*')
        .eq('supplier_account_id', customer.supplier_account_id)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (artError) {
        console.error('Error loading articles:', artError);
        setArticles([]);
      } else {
        setArticles((articlesData || []) as Article[]);
      }

      setNeedsLogin(false);
    } catch (err) {
      console.error('Portal init error:', err);
      setCustomerInfo(null);
      setNeedsLogin(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      await checkAuthAndLoadData();
      toast.success('Willkommen zurück!');
    } catch (err: any) {
      toast.error('Anmeldung fehlgeschlagen: ' + err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCustomerInfo(null);
    setCart([]);
    setViewState('catalog');
    setNeedsLogin(true);
  };

  const addToCart = (article: Article) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.articleId === article.id);
      if (existing) {
        return prev.map((item) =>
          item.articleId === article.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          articleId: article.id,
          name: article.name,
          quantity: 1,
          price: article.base_price,
          unit: article.unit,
        },
      ];
    });
  };

  const updateQuantity = (articleId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.articleId !== articleId) return item;
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const getCartQuantity = (articleId: string) => cart.find((i) => i.articleId === articleId)?.quantity ?? 0;

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const filteredArticles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter(
      (a) => a.name.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q)
    );
  }, [articles, searchTerm]);

  const articlesByCategory = useMemo(() => {
    return filteredArticles.reduce((acc, article) => {
      const cat = article.category || 'Sonstige';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    }, {} as Record<string, Article[]>);
  }, [filteredArticles]);

  const handleSubmitOrder = async () => {
    if (!customerInfo || cart.length === 0) return;

    setSubmitting(true);

    try {
      const items = cart.map(item => ({
        article_id: item.articleId,
        article_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.price,
      }));

      const { data, error } = await supabase.functions.invoke('submit-b2b-order', {
        body: {
          customer_id: customerInfo.id,
          supplier_account_id: customerInfo.supplierAccountId,
          items,
          delivery_address: deliveryAddress || undefined,
          delivery_date: deliveryDate || undefined,
          notes: notes || undefined,
        },
      });

      if (error) throw error;

      setOrderNumber(data.order_number);
      setCart([]);
      setViewState('confirmation');
      toast.success('Bestellung erfolgreich aufgegeben!');
    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast.error('Fehler beim Absenden: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <main className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>B2B Kundenportal</CardTitle>
              <CardDescription>
                {subdomain ? (
                  <>Bitte melden Sie sich an, um <strong>{subdomain}</strong> zu öffnen.</>
                ) : (
                  <>Bitte melden Sie sich an, um das Portal zu nutzen.</>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePortalLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginEmail">E-Mail</Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@beispiel.de"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPassword">Passwort</Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loginLoading}>
                  {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Anmelden
                </Button>
              </form>
              <div className="mt-4">
                <Button variant="ghost" className="w-full" onClick={() => navigate('/b2b/login')}>
                  Zum Lieferanten-Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!customerInfo) return null;

  // Confirmation View
  if (viewState === 'confirmation') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Bestellung aufgegeben!</h2>
              <p className="text-muted-foreground mt-2">
                Ihre Bestellung wurde erfolgreich übermittelt.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Bestellnummer</p>
              <p className="text-lg font-mono font-bold">{orderNumber}</p>
            </div>
            <Button onClick={() => setViewState('catalog')} className="w-full">
              Weitere Artikel bestellen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Checkout View
  if (viewState === 'checkout') {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-card border-b p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={() => setViewState('catalog')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <h1 className="font-semibold">Kasse</h1>
            <div className="w-20" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto p-4 space-y-6 pb-32">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ihre Bestellung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {cart.map(item => (
                <div key={item.articleId} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × €{item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    €{(item.quantity * item.price).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between items-center">
                <p className="font-bold">Gesamtsumme</p>
                <p className="font-bold text-lg">€{cartTotal.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lieferdetails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">Lieferadresse</Label>
                <Textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Straße, PLZ, Ort"
                  rows={3}
                />
              </div>
              <div>
                <Label className="mb-2 block">Gewünschtes Lieferdatum</Label>
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-2 block">Notizen</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optionale Anmerkungen zur Bestellung"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmitOrder}
            disabled={submitting}
            className="w-full h-14 text-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Package className="h-5 w-5 mr-2" />
                Bestellung absenden
              </>
            )}
          </Button>
        </main>
      </div>
    );
  }

  // Catalog View (default)
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{customerInfo.supplierName}</h1>
            <p className="text-sm text-muted-foreground">{customerInfo.companyName}</p>
          </div>
          <nav className="flex items-center gap-3" aria-label="Portal actions">
            <Button variant="outline" size="icon" className="relative" aria-label="Warenkorb">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Abmelden">
              <LogOut className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-32">
        <section aria-label="Suche" className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </section>

        <section aria-label="Artikel" className="space-y-8">
          {Object.entries(articlesByCategory).map(([category, categoryArticles]) => (
            <article key={category} className="space-y-4">
              <h2 className="text-lg font-semibold">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categoryArticles.map((article) => {
                  const qty = getCartQuantity(article.id);
                  return (
                    <Card key={article.id} className="overflow-hidden">
                      {article.image_url && (
                        <div className="aspect-video bg-muted">
                          <img
                            src={article.image_url}
                            alt={`${article.name} Produktfoto`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{article.name}</CardTitle>
                        {article.description && (
                          <CardDescription className="text-sm line-clamp-2">{article.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-lg font-bold">€{article.base_price.toFixed(2)}</span>
                            <span className="text-sm text-muted-foreground ml-1">/ {article.unit}</span>
                          </div>
                          {qty === 0 ? (
                            <Button size="sm" onClick={() => addToCart(article)}>
                              <Plus className="h-4 w-4 mr-1" />
                              Hinzufügen
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(article.id, -1)}
                                aria-label="Menge reduzieren"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-medium">{qty}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(article.id, 1)}
                                aria-label="Menge erhöhen"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </article>
          ))}

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine Artikel gefunden</p>
            </div>
          )}
        </section>
      </main>

      {cart.length > 0 && (
        <aside className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg" aria-label="Warenkorb Übersicht">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <span className="font-medium">{cartItemCount} Artikel</span>
              <span className="mx-2">·</span>
              <span className="text-lg font-bold">€{cartTotal.toFixed(2)}</span>
            </div>
            <Button onClick={() => setViewState('checkout')}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Zur Kasse
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}
