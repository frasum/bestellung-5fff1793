import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Package, Check, X, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePackagingUnits, useCreatePackagingUnit, useUpdatePackagingUnit, useDeletePackagingUnit } from '@/hooks/usePackagingUnits';
import { useArticles } from '@/hooks/useArticles';

export const PackagingUnitsTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: packagingUnits = [], isLoading: unitsLoading } = usePackagingUnits();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const createUnit = useCreatePackagingUnit();
  const updateUnit = useUpdatePackagingUnit();
  const deleteUnit = useDeletePackagingUnit();
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitQuantity, setNewUnitQuantity] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingQuantity, setEditingQuantity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingAll, setIsAddingAll] = useState(false);

  // Get unique packaging_unit values from articles that are not in the database
  const dbQuantities = new Set(packagingUnits.map(u => u.quantity));
  const articlePackagingUnits = [...new Set(articles.map(a => a.packaging_unit).filter((v): v is number => v !== null && v > 1))]
    .filter(qty => !dbQuantities.has(qty))
    .sort((a, b) => a - b);

  const filteredDbUnits = packagingUnits
    .filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.quantity.toString().includes(searchTerm)
    )
    .sort((a, b) => a.quantity - b.quantity);

  const handleAddAllUnits = async () => {
    if (articlePackagingUnits.length === 0) return;
    
    setIsAddingAll(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization found');

      const unitsToAdd = articlePackagingUnits.map(qty => ({
        name: `${qty}er`,
        quantity: qty,
        organization_id: profile.organization_id,
      }));

      const { error } = await supabase
        .from('packaging_units')
        .insert(unitsToAdd);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['packaging-units'] });
      toast.success(t('settings.packagingUnitsAddedSuccess', { count: articlePackagingUnits.length }));
    } catch (error) {
      toast.error(t('settings.packagingUnitsAddError'));
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleAddUnit = (quantity?: number) => {
    const qty = quantity || parseInt(newUnitQuantity, 10);
    const name = quantity ? `${quantity}er` : newUnitName.trim();
    
    if (name && qty > 0) {
      createUnit.mutate({ name, quantity: qty }, {
        onSuccess: () => {
          setNewUnitName('');
          setNewUnitQuantity('');
        },
      });
    }
  };

  const handleStartEdit = (unit: { id: string; name: string; quantity: number }) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
    setEditingQuantity(unit.quantity.toString());
  };

  const handleSaveEdit = () => {
    const qty = parseInt(editingQuantity, 10);
    if (editingId && editingName.trim() && qty > 0) {
      updateUnit.mutate({ id: editingId, name: editingName.trim(), quantity: qty }, {
        onSuccess: () => {
          setEditingId(null);
          setEditingName('');
          setEditingQuantity('');
        },
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingQuantity('');
  };

  const handleDelete = (id: string) => {
    if (confirm(t('settings.deletePackagingUnitConfirm'))) {
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
          <Package className="h-5 w-5" />
          {t('settings.managePackagingUnits')}
        </CardTitle>
        <CardDescription>
          {t('settings.managePackagingUnitsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={t('settings.packagingUnitNamePlaceholder')}
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            className="h-11 sm:h-9 flex-1"
          />
          <Input
            type="number"
            min="1"
            placeholder={t('settings.packagingUnitQuantityPlaceholder')}
            value={newUnitQuantity}
            onChange={(e) => setNewUnitQuantity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
            className="h-11 sm:h-9 w-full sm:w-24"
          />
          <Button 
            onClick={() => handleAddUnit()} 
            disabled={createUnit.isPending || !newUnitName.trim() || !newUnitQuantity || parseInt(newUnitQuantity) < 1} 
            className="h-10 sm:h-9 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('common.add')}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('settings.searchPackagingUnits')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 sm:h-9"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.savedPackagingUnits')} ({filteredDbUnits.length})</h3>
          {filteredDbUnits.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">{t('settings.noSavedPackagingUnits')}</p>
          ) : (
            filteredDbUnits.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                {editingId === unit.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 h-10 sm:h-8"
                      autoFocus
                    />
                    <Input
                      type="number"
                      min="1"
                      value={editingQuantity}
                      onChange={(e) => setEditingQuantity(e.target.value)}
                      className="w-20 h-10 sm:h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                    />
                    <Button size="icon" onClick={handleSaveEdit} disabled={updateUnit.isPending} className="h-10 w-10 sm:h-8 sm:w-8">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-10 w-10 sm:h-8 sm:w-8">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{unit.name}</span>
                      <Badge variant="secondary">{unit.quantity}×</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleStartEdit(unit)} className="h-10 w-10 sm:h-8 sm:w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(unit.id)} className="text-destructive hover:text-destructive h-10 w-10 sm:h-8 sm:w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {articlePackagingUnits.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{t('settings.packagingUnitsFromArticles')} ({articlePackagingUnits.length})</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleAddAllUnits}
                disabled={isAddingAll}
                className="h-10 sm:h-8"
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingAll ? t('settings.addingAll') : t('settings.addAll')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{t('settings.packagingUnitsFromArticlesDesc')}</p>
            <div className="flex flex-wrap gap-2">
              {articlePackagingUnits.map((qty) => (
                <Badge 
                  key={qty} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleAddUnit(qty)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {qty}er ({qty}×)
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
