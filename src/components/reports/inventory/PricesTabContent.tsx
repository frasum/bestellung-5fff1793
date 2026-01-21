import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Article, useUpdateArticle } from '@/hooks/useArticles';
import { useUnits, useCreateUnit, useDeleteUnit, Unit } from '@/hooks/useUnits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ChevronDown, ChevronRight, Merge, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SupplierGroup } from './types';

interface PricesTabContentProps {
  groupedArticlesBySupplier: SupplierGroup[];
  articlesLoading: boolean;
  openPriceSuppliers: Set<string>;
  togglePriceSupplier: (supplierId: string) => void;
  commonUnits: string[];
  units?: Unit[];
  onAddArticle: (supplierId: string) => void;
  onMergeArticles: (supplierId: string) => void;
  onEditArticle: (article: Article) => void;
}

export function PricesTabContent({
  groupedArticlesBySupplier,
  articlesLoading,
  openPriceSuppliers,
  togglePriceSupplier,
  commonUnits,
  units,
  onAddArticle,
  onMergeArticles,
  onEditArticle,
}: PricesTabContentProps) {
  const { t } = useTranslation();
  
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editingUnitValue, setEditingUnitValue] = useState<string>('');
  const [newUnitName, setNewUnitName] = useState('');
  
  const updateArticle = useUpdateArticle();
  const createUnit = useCreateUnit();
  const deleteUnit = useDeleteUnit();

  const handleStartPriceEdit = (articleId: string, currentPrice: number) => {
    setEditingPriceId(articleId);
    setEditingPriceValue(currentPrice.toString());
  };

  const handleCancelPriceEdit = () => {
    setEditingPriceId(null);
    setEditingPriceValue('');
  };

  const handleSavePriceEdit = async (articleId: string) => {
    const newPrice = parseFloat(editingPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error(t('inventory.invalidPrice'));
      return;
    }
    try {
      await updateArticle.mutateAsync({ id: articleId, price: newPrice });
      toast.success(t('inventory.priceUpdated'));
      setEditingPriceId(null);
      setEditingPriceValue('');
    } catch (error) {
      console.error('Failed to save price:', error);
      toast.error(t('inventory.saveError'));
    }
  };

  const handleStartUnitEdit = (articleId: string, currentUnit: string) => {
    setEditingUnitId(articleId);
    setEditingUnitValue(currentUnit);
  };

  const handleCancelUnitEdit = () => {
    setEditingUnitId(null);
    setEditingUnitValue('');
  };

  const handleSaveUnitEdit = async (articleId: string, value?: string) => {
    const unitValue = value ?? editingUnitValue;
    if (!unitValue.trim()) {
      toast.error(t('inventory.unitCannotBeEmpty'));
      return;
    }
    try {
      await updateArticle.mutateAsync({ id: articleId, unit: unitValue.trim() });
      toast.success(t('inventory.unitUpdated'));
      setEditingUnitId(null);
      setEditingUnitValue('');
    } catch (error) {
      console.error('Failed to save unit:', error);
      toast.error(t('inventory.saveError'));
    }
  };

  if (articlesLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (groupedArticlesBySupplier.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">{t('inventory.noArticlesFound')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {groupedArticlesBySupplier.map((group) => {
        const isOpen = openPriceSuppliers.has(group.supplier.id);
        return (
          <Collapsible key={group.supplier.id} open={isOpen} onOpenChange={() => togglePriceSupplier(group.supplier.id)}>
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
                          {group.articles.length} {t('inventory.articles')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                    {group.articles.map((article) => (
                      <div key={article.id} className="p-4">
                        <div className="flex justify-between items-start">
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
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{article.unit}</span>
                              <span className="text-sm font-medium">€{article.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('inventory.article')}</TableHead>
                          <TableHead>{t('inventory.unit')}</TableHead>
                          <TableHead className="text-right">{t('inventory.price')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.articles.map((article) => (
                          <TableRow key={article.id}>
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
                            <TableCell>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-2 py-1 rounded hover:bg-muted">
                                    {article.unit}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2" align="start">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1">
                                      <Input
                                        placeholder={t('inventory.newUnit')}
                                        value={newUnitName}
                                        onChange={(e) => setNewUnitName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && newUnitName.trim()) {
                                            const exactMatch = commonUnits.find(u => u.toLowerCase() === newUnitName.trim().toLowerCase());
                                            if (exactMatch) {
                                              handleSaveUnitEdit(article.id, exactMatch);
                                              setNewUnitName('');
                                            } else {
                                              createUnit.mutate(newUnitName.trim(), {
                                                onSuccess: () => {
                                                  handleSaveUnitEdit(article.id, newUnitName.trim());
                                                  setNewUnitName('');
                                                }
                                              });
                                            }
                                          }
                                        }}
                                        className="h-8 text-sm"
                                      />
                                      {newUnitName.trim() && !commonUnits.some(u => u.toLowerCase() === newUnitName.trim().toLowerCase()) && (
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 shrink-0"
                                          disabled={createUnit.isPending}
                                          onClick={() => {
                                            createUnit.mutate(newUnitName.trim(), {
                                              onSuccess: () => {
                                                handleSaveUnitEdit(article.id, newUnitName.trim());
                                                setNewUnitName('');
                                              }
                                            });
                                          }}
                                        >
                                          <Plus className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto p-1">
                                    {commonUnits
                                      .filter(unit => !newUnitName.trim() || unit.toLowerCase().includes(newUnitName.toLowerCase()))
                                      .map((unit) => {
                                        const dbUnit = units?.find(u => u.name === unit);
                                        return (
                                          <div
                                            key={unit}
                                            className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted cursor-pointer group"
                                            onClick={() => {
                                              handleSaveUnitEdit(article.id, unit);
                                              setNewUnitName('');
                                            }}
                                          >
                                            <span className={`text-sm ${article.unit === unit ? 'font-medium text-primary' : ''}`}>
                                              {unit}
                                            </span>
                                            {dbUnit && (
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteUnit.mutate(dbUnit.id);
                                                }}
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                            <TableCell className="text-right">
                              {editingPriceId === article.id ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingPriceValue}
                                    onChange={(e) => setEditingPriceValue(e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSavePriceEdit(article.id);
                                      if (e.key === 'Escape') handleCancelPriceEdit();
                                    }}
                                    className="w-24 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    autoFocus
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleSavePriceEdit(article.id)}
                                    disabled={updateArticle.isPending}
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={handleCancelPriceEdit}
                                  >
                                    <X className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleStartPriceEdit(article.id, article.price)}
                                  className="font-medium hover:text-primary cursor-pointer transition-colors px-2 py-1 rounded hover:bg-muted"
                                >
                                  €{article.price.toFixed(2)}
                                </button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </>
  );
}
