import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { PenLine } from 'lucide-react';

export interface FreeItem {
  id: string; // Temporary ID for UI tracking
  name: string;
  quantity: number;
  unit: string;
  supplier_id: string;
}

interface FreeItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: Omit<FreeItem, 'id'>) => void;
  supplierId: string;
  editingItem?: FreeItem | null;
  onUpdate?: (item: FreeItem) => void;
}

export function FreeItemDialog({ 
  open, 
  onOpenChange, 
  onAdd, 
  supplierId,
  editingItem,
  onUpdate,
}: FreeItemDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(editingItem?.name || '');
  const [quantity, setQuantity] = useState(editingItem?.quantity || 1);
  const [unit, setUnit] = useState(editingItem?.unit || 'Stk');

  // Reset form when dialog opens/closes or editing item changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && editingItem) {
      setName(editingItem.name);
      setQuantity(editingItem.quantity);
      setUnit(editingItem.unit);
    } else if (!newOpen) {
      setName('');
      setQuantity(1);
      setUnit('Stk');
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    if (editingItem && onUpdate) {
      onUpdate({
        ...editingItem,
        name: name.trim(),
        quantity,
        unit: unit.trim() || 'Stk',
      });
    } else {
      onAdd({
        name: name.trim(),
        quantity,
        unit: unit.trim() || 'Stk',
        supplier_id: supplierId,
      });
    }
    
    setName('');
    setQuantity(1);
    setUnit('Stk');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="h-5 w-5" />
            {editingItem 
              ? t('simpleOrder.editFreeItem', 'Freien Artikel bearbeiten')
              : t('simpleOrder.addFreeItem', 'Freien Artikel hinzufügen')
            }
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="free-item-name">
              {t('simpleOrder.freeItemName', 'Artikelname')} *
            </Label>
            <Input
              id="free-item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('simpleOrder.freeItemNamePlaceholder', 'z.B. Sonderartikel...')}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="free-item-quantity">
                {t('simpleOrder.quantity', 'Menge')} *
              </Label>
              <Input
                id="free-item-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="free-item-unit">
                {t('simpleOrder.unit', 'Einheit')}
              </Label>
              <Input
                id="free-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Stk"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Abbrechen')}
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            {editingItem 
              ? t('common.save', 'Speichern')
              : t('common.add', 'Hinzufügen')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
