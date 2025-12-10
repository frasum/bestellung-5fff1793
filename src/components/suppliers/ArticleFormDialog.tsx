import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Article } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { articleSchema, ArticleFormData } from './schemas';

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingArticle: Article | null;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  onSubmit: (data: ArticleFormData) => Promise<void>;
  isPending: boolean;
}

export const ArticleFormDialog = ({
  open,
  onOpenChange,
  editingArticle,
  suppliers,
  categories,
  units,
  onSubmit,
  isPending
}: ArticleFormDialogProps) => {
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState('');

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '', packaging_unit: '' },
  });

  useEffect(() => {
    if (editingArticle) {
      form.reset({
        supplier_id: editingArticle.supplier_id,
        name: editingArticle.name,
        description: editingArticle.description || '',
        sku: editingArticle.sku || '',
        unit: editingArticle.unit,
        price: String(editingArticle.price),
        category: editingArticle.category || '',
        packaging_unit: editingArticle.packaging_unit ? String(editingArticle.packaging_unit) : '',
      });
    } else {
      form.reset({ supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '', packaging_unit: '' });
    }
  }, [editingArticle, form]);

  const handleSubmit = async (data: ArticleFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Lieferant *</Label>
            <Controller
              name="supplier_id"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Lieferant auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.supplier_id && (
              <p className="text-sm text-destructive">{form.formState.errors.supplier_id.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="article-name">Name *</Label>
            <Input id="article-name" {...form.register('name')} placeholder="San Marzano Tomatoes" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="article-description">Beschreibung</Label>
            <Input id="article-description" {...form.register('description')} placeholder="Premium italienische Tomaten" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="article-price">Preis (€) *</Label>
              <Input id="article-price" type="number" step="0.01" {...form.register('price')} placeholder="4.50" />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
              )}
            </div>
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
                    <PopoverContent className="w-[200px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Einheit suchen..." value={customUnit} onValueChange={setCustomUnit} />
                        <CommandList>
                          <CommandEmpty>
                            {customUnit && (
                              <Button variant="ghost" className="w-full justify-start" onClick={() => {
                                field.onChange(customUnit);
                                setUnitPopoverOpen(false);
                                setCustomUnit('');
                              }}>
                                <Plus className="mr-2 h-4 w-4" />
                                "{customUnit}" hinzufügen
                              </Button>
                            )}
                          </CommandEmpty>
                          <CommandGroup>
                            {units.map((unit) => (
                              <CommandItem key={unit} value={unit} onSelect={() => {
                                field.onChange(unit);
                                setUnitPopoverOpen(false);
                                setCustomUnit('');
                              }}>
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="article-sku">SKU</Label>
              <Input id="article-sku" {...form.register('sku')} placeholder="TOM-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="article-packaging-unit">VPE</Label>
              <Input 
                id="article-packaging-unit" 
                type="number" 
                inputMode="numeric"
                min="1"
                {...form.register('packaging_unit')} 
                placeholder="z.B. 6" 
              />
              {form.formState.errors.packaging_unit && (
                <p className="text-sm text-destructive">{form.formState.errors.packaging_unit.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Controller
              name="category"
              control={form.control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value || ''}>
                  <SelectTrigger className="bg-card">
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border z-50">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingArticle ? 'Speichern' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
