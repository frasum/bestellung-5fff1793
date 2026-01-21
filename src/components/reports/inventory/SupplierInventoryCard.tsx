import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Article } from '@/hooks/useArticles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, CheckCircle, ChevronDown, ChevronRight, Merge, Trash2 } from 'lucide-react';
import { InventoryCountInputs } from './InventoryCountInputs';
import { SupplierGroup } from './types';

interface SupplierInventoryCardProps {
  group: SupplierGroup;
  isOpen: boolean;
  onToggle: () => void;
  getItemValues: (articleId: string) => { storage_1: number; storage_2: number; total: number };
  onItemChange: (articleId: string, field: 'storage_1' | 'storage_2', value: string) => void;
  savingArticleIds: Set<string>;
  savedArticleIds: Set<string>;
  onAddArticle: (supplierId: string) => void;
  onEditArticle: (article: Article) => void;
  onDeleteArticle: (articleId: string) => void;
  onMergeArticles: (supplierId: string) => void;
  isReadOnly?: boolean;
}

export const SupplierInventoryCard = memo(function SupplierInventoryCard({
  group,
  isOpen,
  onToggle,
  getItemValues,
  onItemChange,
  savingArticleIds,
  savedArticleIds,
  onAddArticle,
  onEditArticle,
  onDeleteArticle,
  onMergeArticles,
  isReadOnly = false,
}: SupplierInventoryCardProps) {
  const { t } = useTranslation();

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-base font-medium">
                    {group.supplier.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('inventory.xOfYCaptured', { captured: group.capturedCount, total: group.articles.length })}
                    {group.totalValue > 0 && (
                      <span className="ml-2">• €{group.totalValue.toFixed(2)}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {group.capturedCount > 0 && group.capturedCount === group.articles.length && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {t('inventory.complete')}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddArticle(group.supplier.id);
                  }}
                  title={t('articles.addNew', 'Neuen Artikel hinzufügen')}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMergeArticles(group.supplier.id);
                  }}
                  title={t('articles.mergeTitle', 'Artikel zusammenführen')}
                >
                  <Merge className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-0 pt-0">
            {/* Mobile View */}
            <div className="divide-y divide-border sm:hidden">
              {group.articles.map((article) => {
                const values = getItemValues(article.id);
                return (
                  <div key={article.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 flex-1">
                        <p 
                          className="font-medium text-foreground text-sm cursor-pointer hover:underline hover:text-accent transition-colors"
                          onClick={() => onEditArticle(article)}
                        >
                          {article.name}
                        </p>
                        {article.sku && (
                          <p className="text-xs text-muted-foreground">{article.sku}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {article.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        {values.total > 0 && (
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-sm">{values.total.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">
                              €{(values.total * article.price).toFixed(2)}
                            </p>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => onDeleteArticle(article.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <InventoryCountInputs
                      articleId={article.id}
                      storage1={values.storage_1}
                      storage2={values.storage_2}
                      isSaving={savingArticleIds.has(article.id)}
                      isSaved={savedArticleIds.has(article.id)}
                      onChange={onItemChange}
                      variant="mobile"
                      disabled={isReadOnly}
                    />
                  </div>
                );
              })}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('inventory.article')}</TableHead>
                    <TableHead>{t('inventory.unit')}</TableHead>
                    <TableHead className="text-right">{t('inventory.price')}</TableHead>
                    <TableHead className="w-28 text-center">{t('inventory.storage1')}</TableHead>
                    <TableHead className="w-28 text-center">{t('inventory.storage2')}</TableHead>
                    <TableHead className="w-20 text-right">{t('inventory.sum')}</TableHead>
                    <TableHead className="w-24 text-right">{t('inventory.value')}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.articles.map((article) => {
                    const values = getItemValues(article.id);
                    return (
                      <TableRow key={article.id} className="group">
                        <TableCell>
                          <div>
                            <span 
                              className="font-medium cursor-pointer hover:underline hover:text-accent transition-colors"
                              onClick={() => onEditArticle(article)}
                            >
                              {article.name}
                            </span>
                            {article.sku && (
                              <span className="block text-xs text-muted-foreground">
                                {article.sku}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {article.unit}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          €{article.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <InventoryCountInputs
                            articleId={article.id}
                            storage1={values.storage_1}
                            storage2={values.storage_2}
                            isSaving={savingArticleIds.has(article.id)}
                            isSaved={savedArticleIds.has(article.id)}
                            onChange={onItemChange}
                            variant="desktop"
                            disabled={isReadOnly}
                          />
                        </TableCell>
                        <TableCell>
                          <InventoryCountInputs
                            articleId={article.id}
                            storage1={values.storage_2}
                            storage2={values.storage_1}
                            isSaving={savingArticleIds.has(article.id)}
                            isSaved={savedArticleIds.has(article.id)}
                            onChange={(id, field, val) => {
                              const actualField = field === 'storage_1' ? 'storage_2' : 'storage_1';
                              onItemChange(id, actualField, val);
                            }}
                            variant="desktop"
                            disabled={isReadOnly}
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {values.total > 0 ? values.total.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {values.total > 0
                            ? `€${(values.total * article.price).toFixed(2)}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onDeleteArticle(article.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
});
