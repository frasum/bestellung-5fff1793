import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from '@/components/ui/command';
import { Check, ChevronsUpDown, Package, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrderUnits, useCreateOrderUnit } from '@/hooks/useOrderUnits';

interface SupplierOrderUnitSelectProps {
  value: string;
  onChange: (value: string) => void;
  hasPending?: boolean;
  pendingInfo?: { old_value: string | null } | null;
  className?: string;
}

export function SupplierOrderUnitSelect({
  value,
  onChange,
  hasPending = false,
  pendingInfo,
  className,
}: SupplierOrderUnitSelectProps) {
  const [open, setOpen] = useState(false);
  const [customQuantity, setCustomQuantity] = useState('');
  const [customName, setCustomName] = useState('');
  
  const { data: orderUnits = [] } = useOrderUnits();
  const createOrderUnit = useCreateOrderUnit();

  const getDisplayLabel = () => {
    if (!value) return <span className="text-muted-foreground">-</span>;
    const pu = orderUnits.find(p => String(p.quantity) === value);
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
                            onSuccess: () => {
                              onChange(customQuantity);
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
                  <CommandItem
                    key={pu.id}
                    value={pu.name}
                    onSelect={() => {
                      onChange(String(pu.quantity));
                      setOpen(false);
                      setCustomQuantity('');
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
                    setCustomQuantity('');
                  }}
                  className="text-muted-foreground"
                >
                  Keine BE
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
