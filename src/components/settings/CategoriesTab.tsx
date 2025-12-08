import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Tag, Check, X, Merge } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useCategories';
import { useArticles } from '@/hooks/useArticles';

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

  const articleCategories = [...new Set(articles?.map((a) => a.category).filter(Boolean) || [])] as string[];
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          {t('settings.manageCategories')}
        </CardTitle>
        <CardDescription>
          {t('settings.manageCategoriesDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder={t('settings.newCategoryPlaceholder')}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory} disabled={createCategory.isPending || !newCategoryName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.add')}
          </Button>
        </div>

        {missingCategories.length > 0 && (
          <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{t('settings.categoriesFromArticles')}</h4>
                <p className="text-xs text-muted-foreground">{t('settings.categoriesFromArticlesDesc')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddAllMissingCategories}>
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
            {sortedCategories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                {editingId === category.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{category.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMergingCategory(category)}
                        title={t('settings.mergeCategory')}
                      >
                        <Merge className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeletingCategory(category)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deleteCategoryTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deleteCategoryConfirm', { name: deletingCategory?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!mergingCategory} onOpenChange={(open) => !open && setMergingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.mergeCategoriesTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                {t('settings.mergeCategoriesDesc', { name: mergingCategory?.name })}
              </p>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger>
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
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMergeConfirm}
              disabled={!mergeTargetId || isMerging}
            >
              {isMerging ? t('settings.merging') : t('settings.merge')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
