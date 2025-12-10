import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Search } from 'lucide-react';

interface Article {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string | null;
  sku: string | null;
  packaging_unit: number | null;
  supplier_id: string;
}

interface ArticleListProps {
  articles: Article[];
  quantities: Record<string, number>;
  onQuantityChange: (articleId: string, delta: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export const ArticleList = ({
  articles,
  quantities,
  onQuantityChange,
  search,
  onSearchChange,
}: ArticleListProps) => {
  const { t } = useTranslation();

  // Filter articles by search
  const filteredArticles = articles.filter(article => 
    article.name.toLowerCase().includes(search.toLowerCase()) ||
    article.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Search */}
      <div className="sticky top-[52px] z-10 bg-background border-b p-3">
        <div className="max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('simpleOrder.search', 'ค้นหา... / Suchen...')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-2xl mx-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {filteredArticles
            .sort((a, b) => a.name.localeCompare(b.name, 'de'))
            .map((article) => {
              const qty = quantities[article.id] || 0;
              const isSelected = qty > 0;
              
              // Build compact unit string
              const unitInfo = [
                article.unit,
                article.packaging_unit && article.packaging_unit > 1 ? `${article.packaging_unit}er` : null
              ].filter(Boolean).join(' · ');
              
              return (
                <Card
                  key={article.id}
                  className={`p-3 transition-all ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Article info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base leading-tight">
                        {article.name}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {article.description && (
                          <span className="block text-xs text-muted-foreground/80">{article.description}</span>
                        )}
                        <span>{unitInfo}</span>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant={qty > 0 ? "default" : "outline"}
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => onQuantityChange(article.id, -1)}
                        disabled={qty === 0}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      
                      <span className="w-10 text-center text-xl font-bold">
                        {qty}
                      </span>
                      
                      <Button
                        variant="default"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => onQuantityChange(article.id, 1)}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {t('simpleOrder.noArticles', 'ไม่พบสินค้า / Keine Artikel gefunden')}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
