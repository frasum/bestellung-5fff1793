import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Unit {
  id: string;
  name: string;
}

interface SupplierUnitSelectProps {
  value: string;
  units: Unit[];
  onChange: (value: string) => void;
  onCreateUnit: (name: string) => Promise<void>;
  hasPending?: boolean;
  pendingInfo?: {
    old_value: string | null;
    new_value: string | null;
  } | null;
  className?: string;
}

export function SupplierUnitSelect({
  value,
  units,
  onChange,
  onCreateUnit,
  hasPending,
  pendingInfo,
  className,
}: SupplierUnitSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredUnits = units.filter((unit) =>
    unit.name.toLowerCase().includes(search.toLowerCase())
  );

  const showAddButton = search.trim() && !units.some(
    (u) => u.name.toLowerCase() === search.trim().toLowerCase()
  );

  const handleCreate = async () => {
    if (!search.trim()) return;
    setCreating(true);
    try {
      await onCreateUnit(search.trim());
      onChange(search.trim());
      setSearch('');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (unitName: string) => {
    onChange(unitName);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between h-8 font-normal",
              hasPending && "border-amber-500",
              className
            )}
          >
            <span className="truncate">{value || "Einheit wählen"}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 z-50" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Einheit suchen..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {search.trim() ? (
                  <div className="py-2 px-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Keine Einheit gefunden
                    </p>
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm">Keine Einheiten</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredUnits.map((unit) => (
                  <CommandItem
                    key={unit.id}
                    value={unit.name}
                    onSelect={() => handleSelect(unit.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === unit.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {unit.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {showAddButton && (
                <div className="p-2 border-t">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleCreate}
                    disabled={creating}
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    "{search}" hinzufügen
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {hasPending && pendingInfo && (
        <div className="text-xs">
          <span className="text-amber-600">Ausstehend</span>
          <span className="text-muted-foreground ml-1">
            (vorher: {pendingInfo.old_value || '—'})
          </span>
        </div>
      )}
    </div>
  );
}
