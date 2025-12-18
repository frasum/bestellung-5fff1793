import { useState } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Minus, Package, Search, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DemoSuppliers() {
  const navigate = useNavigate();
  const { getSuppliers, getArticles, addToCart, cart, industry, cartItemCount } = useDemo();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);

  const suppliers = getSuppliers();
  const articles = getArticles();

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSupplier = !selectedSupplier || article.supplierId === selectedSupplier;
    return matchesSearch && matchesSupplier;
  });

  const getCartQuantity = (articleId: string) => {
    const item = cart.find(i => i.articleId === articleId);
    return item?.quantity || 0;
  };

  const handleAddToCart = (article: typeof articles[0]) => {
    const supplier = suppliers.find(s => s.id === article.supplierId);
    addToCart({
      articleId: article.id,
      articleName: article.name,
      unit: article.unit,
      price: article.price,
      supplierId: article.supplierId,
      supplierName: supplier?.name || '',
    });
    toast.success(`${article.name} hinzugefügt`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{industry.terminology.supplierPlural}</h1>
          <p className="text-muted-foreground">
            Demo-Katalog mit Beispielartikeln
          </p>
        </div>
        {cartItemCount > 0 && (
          <Button onClick={() => navigate('/demo/cart')} className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Warenkorb ({cartItemCount})
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedSupplier === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedSupplier(null)}
          >
            Alle
          </Badge>
          {suppliers.map(supplier => (
            <Badge
              key={supplier.id}
              variant={selectedSupplier === supplier.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedSupplier(supplier.id)}
            >
              {supplier.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map(article => {
          const cartQty = getCartQuantity(article.id);
          return (
            <Card key={article.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{article.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{article.supplierName}</p>
                  </div>
                  {article.category && (
                    <Badge variant="secondary" className="shrink-0">
                      {article.category}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold">€{article.price.toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm ml-1">/ {article.unit}</span>
                  </div>
                  {cartQty > 0 ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{cartQty}x</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(article)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => handleAddToCart(article)}>
                      <Plus className="w-4 h-4 mr-1" />
                      Hinzufügen
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredArticles.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Keine Artikel gefunden</p>
        </div>
      )}
    </div>
  );
}
