import { Controller, UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArticleFormData } from '../schemas';

interface ReferencePriceSectionProps {
  form: UseFormReturn<ArticleFormData>;
  units: string[];
}

export function ReferencePriceSection({
  form,
  units,
}: ReferencePriceSectionProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="article-reference-price">Referenzpreis (€)</Label>
          <Input 
            id="article-reference-price" 
            type="text" 
            inputMode="decimal"
            {...form.register('reference_price')} 
            placeholder="10,00" 
          />
          {form.formState.errors.reference_price && (
            <p className="text-sm text-destructive">{form.formState.errors.reference_price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Referenzeinheit</Label>
          <Controller
            name="reference_unit"
            control={form.control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ''}>
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="z.B. kg, L" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="100g">100g</SelectItem>
                  <SelectItem value="100ml">100ml</SelectItem>
                  {units.filter(u => !['kg', 'L', '100g', '100ml'].includes(u)).map((unit) => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Referenzpreis ist optional und dient zum Preisvergleich (z.B. €/kg)
      </p>
    </>
  );
}
