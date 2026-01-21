import { memo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArticleFormData } from '../schemas';

interface OrderUnit {
  id: string;
  name: string;
  quantity: number;
}

interface SkuPackagingSectionProps {
  form: UseFormReturn<ArticleFormData>;
  orderUnits: OrderUnit[];
}

export const SkuPackagingSection = memo(function SkuPackagingSection({
  form,
  orderUnits,
}: SkuPackagingSectionProps) {
  const price = parseFloat(form.watch('price') || '0');
  const packagingUnit = parseFloat(form.watch('packaging_unit') || '0');
  const orderUnitId = form.watch('order_unit_id');
  const selectedOrderUnit = orderUnits.find(u => u.id === orderUnitId);

  // Use packaging_unit if available, otherwise orderUnit.quantity
  const multiplier = packagingUnit > 0 ? packagingUnit : (selectedOrderUnit?.quantity || 1);
  const bePrice = price * multiplier;
  const showBePrice = price > 0 && multiplier > 1;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label htmlFor="article-sku">SKU</Label>
        <Input id="article-sku" {...form.register('sku')} placeholder="TOM-001" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="article-packaging-unit">Stk. pro BE</Label>
        <Input
          id="article-packaging-unit"
          type="number"
          min="0.01"
          step="any"
          {...form.register('packaging_unit')}
          placeholder="z.B. 6"
          onFocus={(e) => e.target.select()}
        />
        <p className="text-xs text-muted-foreground">
          Wie viele Einheiten pro Bestelleinheit?
        </p>
      </div>

      {/* Calculated BE Price */}
      {showBePrice && (
        <div className="space-y-2">
          <Label className="text-muted-foreground">BE-Preis</Label>
          <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted/50">
            <span className="font-semibold text-primary">€{bePrice.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground ml-1">
              /{selectedOrderUnit?.name || 'BE'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {multiplier}× €{price.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
});
