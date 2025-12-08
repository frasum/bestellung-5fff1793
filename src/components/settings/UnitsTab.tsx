import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Ruler, Check, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from '@/hooks/useUnits';
import { useArticles } from '@/hooks/useArticles';

export const UnitsTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: units = [], isLoading: unitsLoading } = useUnits();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const [newUnitName, setNewUnitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingAll, setIsAddingAll] = useState(false);

  const dbUnitNames = new Set(units.map(u => u.name.toLowerCase()));
  const articleUnits = [...new Set(articles.map(a => a.unit).filter(Boolean))]
    .filter(unit => !dbUnitNames.has(unit.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'de'));

  const filteredDbUnits = units
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const filteredArticleUnits = articleUnits
    .filter(u => u.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddAllUnits = async () => {
    if (articleUnits.length === 0) return;
    
    setIsAddingAll(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const unitsToAdd = articleUnits.map(name => ({
        name,
        organization_id: profile.organization_id,
      }));

      const { error } = await supabase
        .from('units')
        .insert(unitsToAdd);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast.success(t('settings.unitsAddedSuccess', { count: articleUnits.length }));
    } catch (error) {
      toast.error(t('settings.unitsAddError'));
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleAddUnit = (name?: string) => {
    const unitName = name || newUnitName;
    if (unitName.trim()) {
      createUnit.mutate(unitName.trim(), {
        onSuccess: () => setNewUnitName(''),
      });
    }
  };

  const handleStartEdit = (unit: { id: string; name: string }) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateUnit.mutate({ id: editingId, name: editingName.trim() }, {
        onSuccess: () => {
          setEditingId(null);
          setEditingName('');
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = (id: string) => {
    if (confirm(t('settings.deleteUnitConfirm'))) {
      deleteUnit.mutate(id);
    }
  };

  if (unitsLoading || articlesLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          {t('settings.manageUnits')}
        </CardTitle>
        <CardDescription>
          {t('settings.manageUnitsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-2">
          <Input
            placeholder={t('settings.newUnitPlaceholder')}
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
          />
          <Button onClick={() => handleAddUnit()} disabled={createUnit.isPending || !newUnitName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.add')}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('settings.searchUnits')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.savedUnits')} ({filteredDbUnits.length})</h3>
          {filteredDbUnits.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">{t('settings.noSavedUnits')}</p>
          ) : (
            filteredDbUnits.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                {editingId === unit.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateUnit.isPending}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{unit.name}</span>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleStartEdit(unit)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(unit.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {filteredArticleUnits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{t('settings.unitsFromArticles')} ({articleUnits.length})</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddAllUnits}
                disabled={isAddingAll}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingAll ? t('settings.addingAll') : t('settings.addAll')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('settings.unitsFromArticlesDesc')}</p>
            <div className="flex flex-wrap gap-2">
              {filteredArticleUnits.map((unit) => (
                <Badge 
                  key={unit} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleAddUnit(unit)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {unit}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
