import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Tag, Check, X, Merge, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useArticles } from '@/hooks/useArticles';
import { cn } from '@/lib/utils';

export const CategoriesTab = () => {
  const { t } = useTranslation();
  const { data: categories = [], isLoading } = useCategories();
  const { data: articles = [] } = useArticles();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; name: string } | null>(null);
  const [mergingCategory, setMergingCategory] = useState<{ id: string; name: string } | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [updatingArticleId, setUpdatingArticleId] = useState<string | null>(null);

  const articleCategories = [...new Set(articles?.map((a) => a.category).filter(Boolean) || [])] as string[];

  // Group articles by category
  const articlesByCategory = useMemo(() => {
    const grouped: Record<string, typeof articles> = {};
    articles.forEach(article => {
      const cat = article.category || '';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(article);
    });
    return grouped;
  }, [articles]);

  // Handle changing article category
  const handleChangeArticleCategory = async (articleId: string, newCategory: string | null) => {
    setUpdatingArticleId(articleId);
    try {
      const { error } = await supabase
        .from('articles')
        .update({ category: newCategory })
        .eq('id', articleId);
      
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      toast.success(t('settings.categoryUpdated'));
    } catch (error) {
      toast.error(t('settings.categoryUpdateError'));
    } finally {
      setUpdatingArticleId(null);
    }
  };
  const dbCategoryNames = categories.map(c => c.name);
  const missingCategories = articleCategories.filter(c => !dbCategoryNames.includes(c));

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategory.mutate(newCategoryName.trim(), {
      onSuccess: () => setNewCategoryName(''),
    });
  };

  const handleStartEdit = (category: { id: string; name: string }) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return;
    updateCategory.mutate(
      { id: editingId, name: editingName.trim() },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => setDeletingCategory(null),
    });
  };

  const handleAddMissingCategory = (name: string) => {
    createCategory.mutate(name);
  };

  const handleAddAllMissingCategories = () => {
    missingCategories.forEach((name) => {
      createCategory.mutate(name);
    });
  };

  const handleMergeConfirm = async () => {
    if (!mergingCategory || !mergeTargetId) return;
    
    const targetCategory = categories.find(c => c.id === mergeTargetId);
    if (!targetCategory) return;

    setIsMerging(true);
    try {
      const { error: updateError } = await supabase
        .from('articles')
        .update({ category: targetCategory.name })
        .eq('category', mergingCategory.name);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', mergingCategory.id);

      if (deleteError) throw deleteError;

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });

      toast.success(t('settings.categoriesMergedSuccess', { source: mergingCategory.name, target: targetCategory.name }));
      setMergingCategory(null);
      setMergeTargetId('');
    } catch (error) {
      toast.error(t('settings.categoriesMergeError'));
    } finally {
      setIsMerging(false);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => 
    a.name.localeCompare(b.name, 'de')
  );

  const mergeTargets = sortedCategories.filter(c => c.id !== mergingCategory?.id);

  if (isLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="categories">
              <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                  <span className="font-medium group-data-[state=open]:text-primary transition-colors">{t('settings.manageCategories')}</span>
                  <Badge variant="secondary" className="ml-1">{categories.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 bg-primary/5">
                <p className="text-sm text-muted-foreground mb-4">{t('settings.manageCategoriesDesc')}</p>
                
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={t('settings.newCategoryPlaceholder')}
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      className="h-11 sm:h-9"
                    />
                    <Button variant="accent" onClick={handleAddCategory} disabled={createCategory.isPending || !newCategoryName.trim()} className="h-10 sm:h-9 w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('common.add')}
                    </Button>
                  </div>

                  {missingCategories.length > 0 && (
                    <div className="p-4 border rounded-lg bg-background space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{t('settings.categoriesFromArticles')}</h4>
                          <p className="text-xs text-muted-foreground">{t('settings.categoriesFromArticlesDesc')}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={handleAddAllMissingCategories} className="h-10 sm:h-8">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('settings.addAll')}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {missingCategories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleAddMissingCategory(cat)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {sortedCategories.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {t('settings.noCategories')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedCategories.map((category) => {
                        const categoryArticles = articlesByCategory[category.name] || [];
                        const isExpanded = expandedCategoryId === category.id;
                        
                        return (
                          <div
                            key={category.id}
                            className={cn(
                              "border rounded-lg bg-background overflow-hidden",
                              isExpanded && "max-h-96 overflow-y-auto"
                            )}
                          >
                            {/* Category Header - Sticky when expanded */}
                            <div className={cn(
                              "flex items-center justify-between p-3 hover:bg-muted/50",
                              isExpanded && "sticky top-0 bg-background z-20 border-b"
                            )}>
                              {editingId === category.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit();
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    className="h-10 sm:h-8"
                                    autoFocus
                                  />
                                  <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="h-10 w-10 sm:h-8 sm:w-8">
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-10 w-10 sm:h-8 sm:w-8">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div 
                                    className="flex items-center gap-2 cursor-pointer flex-1"
                                    onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                                  >
                                    <ChevronRight className={cn(
                                      "h-4 w-4 transition-transform text-muted-foreground",
                                      isExpanded && "rotate-90"
                                    )} />
                                    <span className="font-medium">{category.name}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      {categoryArticles.length}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setMergingCategory(category)}
                                      title={t('settings.mergeCategory')}
                                      className="h-10 w-10 sm:h-8 sm:w-8"
                                    >
                                      <Merge className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" onClick={() => handleStartEdit(category)} className="h-10 w-10 sm:h-8 sm:w-8">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => setDeletingCategory(category)}
                                      className="text-destructive hover:text-destructive h-10 w-10 sm:h-8 sm:w-8"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Expandable Article List - Table with Sticky Header */}
                            {isExpanded && (
                              <div className="bg-muted/30">
                                {categoryArticles.length === 0 ? (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    {t('settings.noArticlesInCategory')}
                                  </p>
                                ) : (
                                  <Table>
                                    <TableHeader className="sticky top-[49px] bg-muted z-10">
                                      <TableRow className="border-b">
                                        <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                                          {t('articles.name')}
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                                          {t('articles.supplier')}
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground uppercase">
                                          {t('articles.unit')}
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground uppercase text-right">
                                          {t('articles.price')}
                                        </TableHead>
                                        <TableHead className="text-xs font-medium text-muted-foreground uppercase w-40">
                                          {t('articles.category')}
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {categoryArticles.map(article => (
                                        <TableRow key={article.id} className="hover:bg-background/50">
                                          <TableCell className="font-medium text-sm">{article.name}</TableCell>
                                          <TableCell className="text-sm text-muted-foreground">
                                            {article.suppliers?.name || t('common.noSupplier')}
                                          </TableCell>
                                          <TableCell className="text-sm text-muted-foreground">
                                            {article.unit || '-'}
                                          </TableCell>
                                          <TableCell className="text-sm text-right">
                                            €{Number(article.price || 0).toFixed(2)}
                                          </TableCell>
                                          <TableCell>
                                            <Select
                                              value={article.category || '__none__'}
                                              onValueChange={(value) => handleChangeArticleCategory(article.id, value === '__none__' ? null : value)}
                                              disabled={updatingArticleId === article.id}
                                            >
                                              <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder={t('settings.selectCategory')} />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="__none__">{t('settings.noCategory')}</SelectItem>
                                                {sortedCategories.map(cat => (
                                                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteCategoryTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deleteCategoryConfirm', { name: deletingCategory?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto h-10 sm:h-9"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!mergingCategory} onOpenChange={(open) => !open && setMergingCategory(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.mergeCategoriesTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                {t('settings.mergeCategoriesDesc', { name: mergingCategory?.name })}
              </p>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger className="h-11 sm:h-10">
                  <SelectValue placeholder={t('settings.selectTargetCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {mergeTargets.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto h-10 sm:h-9">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMergeConfirm}
              disabled={!mergeTargetId || isMerging}
              className="w-full sm:w-auto h-10 sm:h-9"
            >
              {isMerging ? t('settings.merging') : t('settings.merge')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};