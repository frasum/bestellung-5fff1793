import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from '@/components/ui/command';
import { Check, ChevronsUpDown, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePackagingUnits, PackagingUnit } from '@/hooks/usePackagingUnits';

interface SupplierPackagingUnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  hasPending?: boolean;
  pendingInfo?: { old_value: string | null } | null;
  className?: string;
}

export function SupplierPackagingUnitSelect({
  value,
  onChange,
  hasPending = false,
  pendingInfo,
  className,
}: SupplierPackagingUnitSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: packagingUnits = [] } = usePackagingUnits();

  const getDisplayLabel = () => {
    if (!value) return <span className="text-muted-foreground">-</span>;
    const pu = packagingUnits.find(p => String(p.quantity) === value);
    if (pu) {
      return (
        <span className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          {pu.name}
        </span>
      );
    }
    return value;
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
        <PopoverContent className="w-[220px] p-0" align="start">
          <Command>
            <CommandInput placeholder="VPE suchen..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="Menge eingeben..."
                    className="h-9"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const inputValue = (e.target as HTMLInputElement).value;
                        if (inputValue) {
                          onChange(inputValue);
                          setOpen(false);
                        }
                      }
                    }}
                  />
                </div>
              </CommandEmpty>
              <CommandGroup heading="Gespeicherte VPE">
                {packagingUnits.map((pu) => (
                  <CommandItem
                    key={pu.id}
                    value={pu.name}
                    onSelect={() => {
                      onChange(String(pu.quantity));
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === String(pu.quantity) ? "opacity-100" : "opacity-0")} />
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{pu.name}</span>
                    <span className="ml-auto text-muted-foreground text-xs">({pu.quantity})</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  value="clear"
                  onSelect={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className="text-muted-foreground"
                >
                  Keine VPE
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
    </div>
  );
}
