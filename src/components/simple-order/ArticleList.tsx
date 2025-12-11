import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Minus, Plus, Search, Star } from 'lucide-react';

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
  sort_order?: number;
}

interface Supplier {
  id: string;
  name: string;
}

// Sort articles: favorites first, then by sort_order, then alphabetically
const sortArticles = (articles: Article[], favoriteIds: Set<string>) => {
  return [...articles].sort((a, b) => {
    // Favorites first
    const aIsFav = favoriteIds.has(a.id) ? 0 : 1;
    const bIsFav = favoriteIds.has(b.id) ? 0 : 1;
    if (aIsFav !== bIsFav) return aIsFav - bIsFav;
    
    // Then by sort_order
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) return orderA - orderB;
    
    // Then alphabetically
    return a.name.localeCompare(b.name, 'de');
  });
};

interface ArticleListProps {
  articles: Article[];
  quantities: Record<string, number>;
  onQuantityChange: (articleId: string, delta: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  // Global search props
  allArticles?: Article[];
  suppliers?: Supplier[];
  selectedSupplierId?: string | null;
  onSupplierChange?: (supplierId: string) => void;
  // Favorites
  favoriteIds?: Set<string>;
  onToggleFavorite?: (articleId: string) => void;
}

export const ArticleList = ({
  articles,
  quantities,
  onQuantityChange,
  search,
  onSearchChange,
  allArticles = [],
  suppliers = [],
  selectedSupplierId,
  onSupplierChange,
  favoriteIds = new Set(),
  onToggleFavorite,
}: ArticleListProps) => {
  const { t } = useTranslation();

  const isGlobalSearch = search.trim().length > 0 && allArticles.length > 0 && suppliers.length > 1;

  // Filter articles by search - global or local
  const searchLower = search.toLowerCase();
  
  // Current supplier articles (filtered)
  const filteredCurrentArticles = articles.filter(article => 
    article.name.toLowerCase().includes(searchLower) ||
    article.description?.toLowerCase().includes(searchLower) ||
    article.category?.toLowerCase().includes(searchLower)
  );

  // Split into favorites and non-favorites for display
  const sortedArticles = sortArticles(filteredCurrentArticles, favoriteIds);
  const favoriteArticles = sortedArticles.filter(a => favoriteIds.has(a.id));
  const nonFavoriteArticles = sortedArticles.filter(a => !favoriteIds.has(a.id));

  // Other suppliers' articles (only when searching)
  const otherSuppliersArticles = isGlobalSearch
    ? allArticles.filter(article => 
        article.supplier_id !== selectedSupplierId &&
        (article.name.toLowerCase().includes(searchLower) ||
         article.description?.toLowerCase().includes(searchLower) ||
         article.category?.toLowerCase().includes(searchLower))
      )
    : [];

  // Group other suppliers' articles by supplier
  const groupedOtherArticles = otherSuppliersArticles.reduce((acc, article) => {
    if (!acc[article.supplier_id]) {
      acc[article.supplier_id] = [];
    }
    acc[article.supplier_id].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

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
        {/* Favorites Section */}
        {favoriteArticles.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('simpleOrder.favorites', 'Favoriten')}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {favoriteArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  quantity={quantities[article.id] || 0}
                  onQuantityChange={onQuantityChange}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Articles Section */}
        {nonFavoriteArticles.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {nonFavoriteArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                quantity={quantities[article.id] || 0}
                onQuantityChange={onQuantityChange}
                isFavorite={false}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* Other suppliers' articles (global search results) */}
        {Object.entries(groupedOtherArticles).map(([supplierId, supplierArticles]) => {
          const supplier = suppliers.find(s => s.id === supplierId);
          if (!supplier) return null;
          
          return (
            <div key={supplierId} className="mt-6">
              <button
                className="w-full text-left mb-2 px-2 py-1 bg-muted/50 rounded-lg flex items-center justify-between hover:bg-muted transition-colors"
                onClick={() => onSupplierChange?.(supplierId)}
              >
                <span className="font-semibold text-muted-foreground">
                  {supplier.name} ({supplierArticles.length})
                </span>
                <span className="text-xs text-primary">
                  {t('simpleOrder.switchTo', 'Wechseln →')}
                </span>
              </button>
              <div className="grid grid-cols-1 gap-2 opacity-75">
                {sortArticles(supplierArticles, favoriteIds).slice(0, 3).map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    quantity={0}
                    onQuantityChange={() => onSupplierChange?.(supplierId)}
                    isOtherSupplier
                  />
                ))}
                {supplierArticles.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center py-1">
                    +{supplierArticles.length - 3} {t('simpleOrder.moreArticles', 'weitere Artikel')}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {filteredCurrentArticles.length === 0 && Object.keys(groupedOtherArticles).length === 0 && (
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

// Extracted article card component
interface ArticleCardProps {
  article: Article;
  quantity: number;
  onQuantityChange: (articleId: string, delta: number) => void;
  isOtherSupplier?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (articleId: string) => void;
}

const ArticleCard = ({ 
  article, 
  quantity, 
  onQuantityChange, 
  isOtherSupplier,
  isFavorite = false,
  onToggleFavorite,
}: ArticleCardProps) => {
  const isSelected = quantity > 0;
  
  const unitInfo = [
    article.unit,
    article.packaging_unit && article.packaging_unit > 1 ? `${article.packaging_unit}er` : null
  ].filter(Boolean).join(' · ');
  
  return (
    <Card
      className={`p-3 transition-all ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:shadow-md'
      } ${isOtherSupplier ? 'cursor-pointer' : ''}`}
      onClick={isOtherSupplier ? () => onQuantityChange(article.id, 0) : undefined}
    >
      <div className="flex items-center gap-3">
        {/* Favorite Star */}
        {!isOtherSupplier && onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(article.id);
            }}
            className="flex-shrink-0 min-h-11 min-w-11 p-2 -ml-1 rounded-full hover:bg-muted transition-colors touch-manipulation"
          >
            <Star 
              className={`h-6 w-6 transition-colors ${
                isFavorite 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-muted-foreground/40 hover:text-yellow-400'
              }`} 
            />
          </button>
        )}

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

        {!isOtherSupplier && (
          <div className="flex items-center gap-2">
            <Button
              variant={quantity > 0 ? "default" : "outline"}
              size="icon"
              className="h-12 w-12 rounded-full touch-manipulation"
              onClick={() => onQuantityChange(article.id, -1)}
              disabled={quantity === 0}
            >
              <Minus className="h-6 w-6" />
            </Button>
            
            <span className="w-10 text-center text-xl font-bold">
              {quantity}
            </span>
            
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full touch-manipulation"
              onClick={() => onQuantityChange(article.id, 1)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
