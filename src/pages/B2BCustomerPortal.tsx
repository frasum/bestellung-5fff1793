import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, ShoppingCart, LogOut, Package, Search, Plus, Minus } from 'lucide-react';

interface Article {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
  unit: string;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
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
}

export default function B2BCustomerPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/b2b/login');
        return;
      }

      // Get customer info
      const { data: customer, error: custError } = await supabase
        .from('supplier_b2b_customers')
        .select(`
          id,
          company_name,
          supplier_account_id,
          supplier_b2b_accounts!inner(company_name)
        `)
        .eq('user_id', user.id)
        .single();

      if (custError || !customer) {
        toast({ title: 'Kein Kundenzugang gefunden', variant: 'destructive' });
        navigate('/');
        return;
      }

      setCustomerInfo({
        id: customer.id,
        companyName: customer.company_name,
        supplierAccountId: customer.supplier_account_id,
        supplierName: (customer.supplier_b2b_accounts as any).company_name
      });

      // Load articles
      const { data: articlesData, error: artError } = await supabase
        .from('supplier_b2b_articles')
        .select('*')
        .eq('supplier_account_id', customer.supplier_account_id)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (artError) {
        console.error('Error loading articles:', artError);
      } else {
        setArticles(articlesData || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/b2b/login');
  };

  const addToCart = (article: Article) => {
    setCart(prev => {
      const existing = prev.find(item => item.articleId === article.id);
      if (existing) {
        return prev.map(item => 
          item.articleId === article.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        articleId: article.id,
        name: article.name,
        quantity: 1,
        price: article.base_price,
        unit: article.unit
      }];
    });
  };

  const updateQuantity = (articleId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.articleId === articleId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (articleId: string) => {
    setCart(prev => prev.filter(item => item.articleId !== articleId));
  };

  const getCartQuantity = (articleId: string) => {
    const item = cart.find(i => i.articleId === articleId);
    return item?.quantity || 0;
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredArticles = articles.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const articlesByCategory = filteredArticles.reduce((acc, article) => {
    const cat = article.category || 'Sonstige';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customerInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{customerInfo.supplierName}</h1>
            <p className="text-sm text-muted-foreground">{customerInfo.companyName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Articles by Category */}
        {Object.entries(articlesByCategory).map(([category, categoryArticles]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold mb-4">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoryArticles.map(article => {
                const qty = getCartQuantity(article.id);
                return (
                  <Card key={article.id} className="overflow-hidden">
                    {article.image_url && (
                      <div className="aspect-video bg-muted">
                        <img 
                          src={article.image_url} 
                          alt={article.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{article.name}</CardTitle>
                      {article.description && (
                        <CardDescription className="text-sm line-clamp-2">
                          {article.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold">
                            €{article.base_price.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground ml-1">
                            / {article.unit}
                          </span>
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
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{qty}</span>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-8 w-8"
                              onClick={() => updateQuantity(article.id, 1)}
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
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Keine Artikel gefunden</p>
          </div>
        )}
      </main>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
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
        </div>
      )}
    </div>
  );
}
