import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from '@/components/ui/command';
import { Check, ChevronsUpDown, Package, Save, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrderUnits, useCreateOrderUnit, useUpdateOrderUnit, useDeleteOrderUnit, OrderUnit } from '@/hooks/useOrderUnits';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface SupplierOrderUnitSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  hasPending?: boolean;
  pendingInfo?: { old_value: string | null } | null;
  className?: string;
  isFilter?: boolean;
  filterLabel?: string;
}

export function SupplierOrderUnitSelect({
  value,
  onChange,
  hasPending = false,
  pendingInfo,
  className,
  isFilter = false,
  filterLabel = 'Alle',
}: SupplierOrderUnitSelectProps) {
  const [open, setOpen] = useState(false);
  const [customQuantity, setCustomQuantity] = useState('');
  const [customName, setCustomName] = useState('');
  const [editingUnit, setEditingUnit] = useState<{ id: string; name: string; quantity: number } | null>(null);
  const [deleteUnit, setDeleteUnit] = useState<OrderUnit | null>(null);
  
  const { data: orderUnits = [] } = useOrderUnits();
  const createOrderUnit = useCreateOrderUnit();
  const updateOrderUnit = useUpdateOrderUnit();
  const deleteOrderUnitMutation = useDeleteOrderUnit();

  const handleSaveEdit = () => {
    if (!editingUnit || !editingUnit.name.trim() || editingUnit.quantity < 1) return;
    updateOrderUnit.mutate({
      id: editingUnit.id,
      name: editingUnit.name.trim(),
      quantity: editingUnit.quantity
    }, {
      onSuccess: () => setEditingUnit(null)
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteUnit) return;
    deleteOrderUnitMutation.mutate(deleteUnit.id, {
      onSuccess: () => {
        setDeleteUnit(null);
        // Clear selection if deleted unit was selected
        if (value === deleteUnit.id) {
          onChange(null);
        }
      }
    });
  };

  const getDisplayLabel = () => {
    if (!value) {
      if (isFilter) return <span className="truncate">{filterLabel}</span>;
      return <span className="text-muted-foreground">—</span>;
    }
    const pu = orderUnits.find(p => p.id === value);
    if (pu) {
      return (
        <span className="flex items-center gap-2 truncate">
          <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{pu.quantity}× {pu.name}</span>
        </span>
      );
    }
    return <span className="text-muted-foreground">—</span>;
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-card",
              hasPending && "border-amber-500",
              className
            )}
          >
            {getDisplayLabel()}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="BE suchen..." 
              value={customQuantity}
              onValueChange={setCustomQuantity}
            />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 space-y-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="Menge eingeben..."
                    className="h-9"
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (customQuantity) {
                          onChange(customQuantity);
                          setOpen(false);
                          setCustomQuantity('');
                          setCustomName('');
                        }
                      }
                    }}
                  />
                  {customQuantity && !orderUnits.find(pu => pu.quantity === parseInt(customQuantity)) && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Als neue BE speichern:</p>
                      <Input
                        placeholder={`z.B. ${customQuantity}er Kiste`}
                        className="h-9"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                      <Button 
                        size="sm" 
                        className="w-full h-8"
                        disabled={!customName || createOrderUnit.isPending}
                        onClick={() => {
                          createOrderUnit.mutate({
                            name: customName,
                            quantity: parseInt(customQuantity)
                          }, {
                            onSuccess: (newUnit) => {
                              if (newUnit) onChange(newUnit.id);
                              setOpen(false);
                              setCustomQuantity('');
                              setCustomName('');
                            }
                          });
                        }}
                      >
                        <Save className="mr-2 h-3 w-3" />
                        BE speichern
                      </Button>
                    </div>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup heading="Gespeicherte BE">
                {orderUnits.map((pu) => (
                  editingUnit?.id === pu.id ? (
                    <div key={pu.id} className="flex items-center gap-1 px-2 py-1.5">
                      <Input
                        value={editingUnit.name}
                        onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })}
                        className="h-7 flex-1 text-sm"
                        autoFocus
                      />
                      <Input
                        type="number"
                        min="1"
                        value={editingUnit.quantity}
                        onChange={(e) => setEditingUnit({ ...editingUnit, quantity: parseInt(e.target.value) || 1 })}
                        className="h-7 w-14 text-sm"
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={handleSaveEdit}
                        disabled={updateOrderUnit.isPending}
                      >
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={() => setEditingUnit(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                  <CommandItem
                      key={pu.id}
                      value={pu.name}
                      onSelect={() => {
                        onChange(pu.id);
                        setOpen(false);
                        setCustomQuantity('');
                      }}
                      className="group"
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === pu.id ? "opacity-100" : "opacity-0")} />
                      <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{pu.name}</span>
                      <span className="text-muted-foreground text-xs mr-2">({pu.quantity})</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingUnit({ id: pu.id, name: pu.name, quantity: pu.quantity });
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteUnit(pu);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </CommandItem>
                  )
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  value="clear"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                    setCustomQuantity('');
                  }}
                  className="text-muted-foreground"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === null ? "opacity-100" : "opacity-0")} />
                  {isFilter ? filterLabel : 'Keine BE'}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {pendingInfo && (
        <p className="text-xs mt-1">
          <span className="text-amber-600">Ausstehend</span>
          <span className="text-muted-foreground ml-1">
            (vorher: {pendingInfo.old_value || '—'})
          </span>
        </p>
      )}

      <AlertDialog open={!!deleteUnit} onOpenChange={(open) => !open && setDeleteUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bestelleinheit löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Bestelleinheit "{deleteUnit?.name}" wirklich löschen? 
              Artikel, die diese BE verwenden, werden nicht mehr mit dieser BE verknüpft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
