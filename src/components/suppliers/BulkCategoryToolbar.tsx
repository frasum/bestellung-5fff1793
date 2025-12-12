import { useState } from 'react';
import { Tags, ChevronsUpDown, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface OrderUnit {
  id: string;
  name: string;
  quantity: number;
}

interface BulkCategoryToolbarProps {
  selectedCount: number;
  categories: string[];
  orderUnits?: OrderUnit[];
  onAssignCategory: (category: string | null) => void;
  onAssignOrderUnit?: (orderUnitId: string | null) => void;
  onClearSelection: () => void;
}

export const BulkCategoryToolbar = ({
  selectedCount,
  categories,
  orderUnits = [],
  onAssignCategory,
  onAssignOrderUnit,
  onClearSelection
}: BulkCategoryToolbarProps) => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [orderUnitOpen, setOrderUnitOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const handleAssignCategory = (category: string | null) => {
    onAssignCategory(category);
    setCategoryOpen(false);
    setCustomCategory('');
  };

  const handleAssignOrderUnit = (orderUnitId: string | null) => {
    onAssignOrderUnit?.(orderUnitId);
    setOrderUnitOpen(false);
  };

  const sortedOrderUnits = [...orderUnits].sort((a, b) => a.name.localeCompare(b.name, 'de'));

  return (
    <div className="flex items-center gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex-wrap">
      <span className="text-sm font-medium">{selectedCount} Artikel ausgewählt</span>
      
      {/* Category Assignment */}
      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Tags className="w-4 h-4 mr-2" />
            Kategorie zuweisen
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-popover border border-border z-50" align="start">
          <Command>
            <CommandInput placeholder="Kategorie suchen oder eingeben..." value={customCategory} onValueChange={setCustomCategory} />
            <CommandList>
              <CommandEmpty>
                {customCategory && (
                  <button type="button" className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent cursor-pointer" onClick={() => handleAssignCategory(customCategory)}>
                    "{customCategory}" hinzufügen
                  </button>
                )}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem value="__remove__" onSelect={() => handleAssignCategory(null)} className="text-destructive">
                  Kategorie entfernen
                </CommandItem>
                {categories.map((category) => (
                  <CommandItem key={category} value={category} onSelect={() => handleAssignCategory(category)}>
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Order Unit Assignment */}
      {onAssignOrderUnit && orderUnits.length > 0 && (
        <Popover open={orderUnitOpen} onOpenChange={setOrderUnitOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Package className="w-4 h-4 mr-2" />
              Bestelleinheit zuweisen
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-popover border border-border z-50" align="start">
            <Command>
              <CommandInput placeholder="Bestelleinheit suchen..." />
              <CommandList>
                <CommandEmpty>Keine Bestelleinheit gefunden.</CommandEmpty>
                <CommandGroup>
                  <CommandItem value="__remove__" onSelect={() => handleAssignOrderUnit(null)} className="text-destructive">
                    Bestelleinheit entfernen
                  </CommandItem>
                  {sortedOrderUnits.map((unit) => (
                    <CommandItem key={unit.id} value={unit.name} onSelect={() => handleAssignOrderUnit(unit.id)}>
                      {unit.quantity}× {unit.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Auswahl aufheben
      </Button>
    </div>
  );
};
