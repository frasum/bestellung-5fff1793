import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Package, Check, X, Search } from 'lucide-react';
import { useOrderUnits, useCreateOrderUnit, useUpdateOrderUnit, useDeleteOrderUnit } from '@/hooks/useOrderUnits';

export const OrderUnitsTab = () => {
  const { t } = useTranslation();
  const { data: orderUnits = [], isLoading: unitsLoading } = useOrderUnits();
  const createUnit = useCreateOrderUnit();
  const updateUnit = useUpdateOrderUnit();
  const deleteUnit = useDeleteOrderUnit();
  const [newUnitName, setNewUnitName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDbUnits = orderUnits
    .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));

  const handleAddUnit = () => {
    const name = newUnitName.trim();
    if (name) {
      createUnit.mutate({ name, quantity: 1 }, {
        onSuccess: () => {
          setNewUnitName('');
        },
      });
    }
  };

  const handleStartEdit = (unit: { id: string; name: string }) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      updateUnit.mutate({ id: editingId, name: editingName.trim(), quantity: 1 }, {
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
    if (confirm(t('settings.deleteOrderUnitConfirm'))) {
      deleteUnit.mutate(id);
    }
  };

  if (unitsLoading) {
    return <Card><CardContent className="p-6">{t('common.loading')}</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t('settings.manageOrderUnits')}
        </CardTitle>
        <CardDescription>
          {t('settings.manageOrderUnitsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder={t('settings.orderUnitNamePlaceholder')}
            value={newUnitName}
            onChange={(e) => setNewUnitName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
            className="h-11 sm:h-9 flex-1"
          />
          <Button 
            onClick={handleAddUnit} 
            disabled={createUnit.isPending || !newUnitName.trim()} 
            className="h-10 sm:h-9 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('common.add')}
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('settings.searchOrderUnits')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 sm:h-9"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{t('settings.savedOrderUnits')} ({filteredDbUnits.length})</h3>
          {filteredDbUnits.length === 0 ? (
            <p className="text-muted-foreground text-center py-4 text-sm">{t('settings.noSavedOrderUnits')}</p>
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
                    <span className="font-medium">{unit.name}</span>
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

      </CardContent>
    </Card>
  );
};
