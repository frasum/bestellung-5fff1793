import { useState } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, Package, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ArticleFormData } from '../schemas';

interface OrderUnit {
  id: string;
  name: string;
  quantity: number;
}

interface PricingSectionProps {
  form: UseFormReturn<ArticleFormData>;
  units: string[];
  orderUnits: OrderUnit[];
  createOrderUnit: {
    mutate: (data: { name: string; quantity: number }, options?: { onSuccess?: (newUnit: OrderUnit) => void }) => void;
    isPending: boolean;
  };
}

export function PricingSection({
  form,
  units,
  orderUnits,
  createOrderUnit,
}: PricingSectionProps) {
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [orderUnitPopoverOpen, setOrderUnitPopoverOpen] = useState(false);
  const [customOrderQuantity, setCustomOrderQuantity] = useState('');
  const [customOrderName, setCustomOrderName] = useState('');

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="article-price">Preis (€) *</Label>
        <Input 
          id="article-price" 
          type="number" 
          inputMode="decimal"
          step="0.01"
          onFocus={(e) => e.target.select()}
          {...form.register('price')} 
          placeholder="1.99" 
        />
        {form.formState.errors.price && (
          <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
        )}
      </div>
      
      {/* Unit */}
      <div className="space-y-2">
        <Label>Einheit *</Label>
        <Controller
          name="unit"
          control={form.control}
          render={({ field }) => (
            <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={unitPopoverOpen} className="w-full justify-between bg-card">
                  {field.value || "Auswählen"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[180px] p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Suchen oder neu..." 
                    value={customUnit}
                    onValueChange={setCustomUnit}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => {
                          if (customUnit.trim()) {
                            field.onChange(customUnit.trim());
                            setUnitPopoverOpen(false);
                            setCustomUnit('');
                          }
                        }}
                      >
                        "{customUnit}" erstellen
                      </Button>
                    </CommandEmpty>
                    <CommandGroup heading="Einheiten">
                      {units.map((unit) => (
                        <CommandItem 
                          key={unit} 
                          value={unit}
                          onSelect={() => {
                            field.onChange(unit);
                            setUnitPopoverOpen(false);
                            setCustomUnit('');
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", field.value === unit ? "opacity-100" : "opacity-0")} />
                          {unit}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        />
      </div>
      
      {/* Order Unit */}
      <div className="space-y-2">
        <Label>Bestelleinheit</Label>
        <Controller
          name="order_unit_id"
          control={form.control}
          render={({ field }) => {
            const selectedUnit = orderUnits.find(u => u.id === field.value);
            return (
              <Popover open={orderUnitPopoverOpen} onOpenChange={setOrderUnitPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={orderUnitPopoverOpen} className="w-full justify-between bg-card">
                    {selectedUnit ? (
                      <span className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                        {selectedUnit.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Auswählen</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="BE suchen..." 
                      value={customOrderQuantity}
                      onValueChange={setCustomOrderQuantity}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="p-2 space-y-2">
                          <p className="text-xs text-muted-foreground">Neue BE erstellen:</p>
                          <Input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            placeholder="Menge eingeben..."
                            className="h-9"
                            value={customOrderQuantity}
                            onChange={(e) => setCustomOrderQuantity(e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {customOrderQuantity && (
                            <div className="space-y-2 pt-2 border-t">
                              <Input
                                placeholder={`z.B. ${customOrderQuantity}er Kiste`}
                                className="h-9"
                                value={customOrderName}
                                onChange={(e) => setCustomOrderName(e.target.value)}
                              />
                              <Button 
                                size="sm" 
                                className="w-full h-8"
                                disabled={!customOrderName || createOrderUnit.isPending}
                                onClick={() => {
                                  createOrderUnit.mutate({
                                    name: customOrderName,
                                    quantity: parseInt(customOrderQuantity)
                                  }, {
                                    onSuccess: (newUnit) => {
                                      field.onChange(newUnit.id);
                                      setOrderUnitPopoverOpen(false);
                                      setCustomOrderQuantity('');
                                      setCustomOrderName('');
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
                      <CommandGroup heading="Bestelleinheiten">
                        {orderUnits.map((unit) => (
                          <CommandItem 
                            key={unit.id} 
                            value={unit.name}
                            onSelect={() => {
                              field.onChange(unit.id);
                              setOrderUnitPopoverOpen(false);
                              setCustomOrderQuantity('');
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", field.value === unit.id ? "opacity-100" : "opacity-0")} />
                            <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{unit.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {field.value && (
                        <CommandGroup>
                          <CommandItem
                            value="clear"
                            onSelect={() => {
                              field.onChange('');
                              setOrderUnitPopoverOpen(false);
                              setCustomOrderQuantity('');
                            }}
                            className="text-muted-foreground"
                          >
                            Keine BE
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            );
          }}
        />
      </div>
    </div>
  );
}
