import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Minus, Check } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Article {
  id: string;
  name: string;
  supplier_id: string;
}

interface AddArticleSheetSimpleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string | null;
  supplierName: string;
  quantities: Record<string, number>;
  onQuantityChange: (articleId: string, delta: number) => void;
  articles: Article[];
}

export const AddArticleSheetSimple = ({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  quantities,
  onQuantityChange,
  articles,
}: AddArticleSheetSimpleProps) => {
  const { t } = useTranslation();
  const { heavyTap } = useHapticFeedback();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter articles by supplier
  const supplierArticles = useMemo(() => 
    articles.filter(a => a.supplier_id === supplierId),
    [articles, supplierId]
  );

  // Filter articles by search query only - no sorting to preserve original order
  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return supplierArticles.filter(article => 
      article.name.toLowerCase().includes(query)
    );
  }, [supplierArticles, searchQuery]);

  const handleQuantityChange = (articleId: string, delta: number) => {
    heavyTap();
    onQuantityChange(articleId, delta);
  };

  const itemsInCartCount = filteredArticles.filter(a => (quantities[a.id] || 0) > 0).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
          <SheetTitle className="text-left">{supplierName}</SheetTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
              autoFocus
            />
          </div>
          {itemsInCartCount > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Check className="w-3 h-3 mr-1" />
                {t('cart.itemCount', { count: itemsInCartCount })}
              </Badge>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          {filteredArticles.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? t('common.noResults') : t('articles.noArticles')}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredArticles.map((article) => {
                const inCart = quantities[article.id] || 0;
                return (
                  <div 
                    key={article.id} 
                    className={`p-4 ${inCart > 0 ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm">
                          {article.name}
                        </h4>
                        {inCart > 0 && (
                          <Badge variant="default" className="mt-1.5 text-xs">
                            {t('cart.inCart')}: {inCart}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="icon"
                          variant={inCart > 0 ? "default" : "outline"}
                          className="h-11 w-11 touch-manipulation"
                          onClick={() => handleQuantityChange(article.id, -1)}
                          disabled={inCart === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <div className="w-10 text-center font-medium text-foreground">
                          {inCart}
                        </div>
                        <Button
                          size="icon"
                          variant={inCart > 0 ? "default" : "outline"}
                          className="h-11 w-11 touch-manipulation"
                          onClick={() => handleQuantityChange(article.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-border bg-background">
          <Button 
            className="w-full h-12" 
            onClick={() => onOpenChange(false)}
          >
            {t('common.done')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
