import { Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Supplier, Article } from './types';
import { ArticleRow } from './ArticleRow';

interface ArticlesListProps {
  suppliers: Supplier[];
  articles: Article[];
  articlesBySupplier: Array<{ supplier: Supplier; articles: Article[] }>;
  selectedSupplier: string | null;
  setSelectedSupplier: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getCartQuantity: (articleId: string) => number;
  onAddArticle: (article: Article) => void;
  onUpdateCartItem: (articleId: string, quantity: number) => void;
}

export const ArticlesList = ({
  suppliers,
  articles,
  articlesBySupplier,
  selectedSupplier,
  setSelectedSupplier,
  searchQuery,
  setSearchQuery,
  getCartQuantity,
  onAddArticle,
  onUpdateCartItem,
}: ArticlesListProps) => {
  return (
    <main className="flex-1 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Artikel suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Supplier Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          <Button
            variant={selectedSupplier === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSupplier(null)}
            className="shrink-0"
          >
            Alle ({articles.length})
          </Button>
          {suppliers.map(supplier => {
            const count = articles.filter(a => a.supplier_id === supplier.id).length;
            return (
              <Button
                key={supplier.id}
                variant={selectedSupplier === supplier.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSupplier(supplier.id)}
                className="shrink-0"
              >
                {supplier.name} ({count})
              </Button>
            );
          })}
        </div>

        {/* Articles List */}
        {articlesBySupplier.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Keine Artikel gefunden</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {articlesBySupplier.map(({ supplier, articles: supplierArticles }) => (
              <div key={supplier.id} className="border rounded-lg overflow-hidden bg-card">
                <div className="bg-muted/50 px-4 py-3 border-b">
                  <h2 className="text-lg font-semibold">{supplier.name}</h2>
                  <p className="text-sm text-muted-foreground">{supplierArticles.length} Artikel</p>
                </div>
                
                <div className="divide-y">
                  {supplierArticles.map(article => (
                    <ArticleRow
                      key={article.id}
                      article={article}
                      cartQuantity={getCartQuantity(article.id)}
                      onAdd={() => onAddArticle(article)}
                      onUpdateQuantity={(qty) => onUpdateCartItem(article.id, qty)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
