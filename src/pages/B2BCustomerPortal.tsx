import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, LogOut, Package, Search, Plus, Minus, Lock } from 'lucide-react';

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
}

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
        toast({
          title: 'Falsches Portal',
          description: `Dieser Login gehört nicht zu „${subdomain}“.`,
          variant: 'destructive',
        });
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
      });

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
    } catch (err: any) {
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCustomerInfo(null);
    setCart([]);
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

      <main className="container mx-auto px-4 py-6">
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
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Zur Kasse
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}
