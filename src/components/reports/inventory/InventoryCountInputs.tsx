import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryCountInputsProps {
  articleId: string;
  storage1: number;
  storage2: number;
  isSaving: boolean;
  isSaved: boolean;
  onChange: (articleId: string, field: 'storage_1' | 'storage_2', value: string) => void;
  variant?: 'mobile' | 'desktop';
  disabled?: boolean;
}

export const InventoryCountInputs = memo(function InventoryCountInputs({
  articleId,
  storage1,
  storage2,
  isSaving,
  isSaved,
  onChange,
  variant = 'desktop',
  disabled = false,
}: InventoryCountInputsProps) {
  const { t } = useTranslation();

  if (variant === 'mobile') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Label className="text-xs text-muted-foreground mb-1 block">{t('inventory.storage1')}</Label>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={storage1 || ''}
              onChange={(e) => onChange(articleId, 'storage_1', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              className={cn(
                "h-11 text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-8",
                isSaving && "border-amber-400",
                isSaved && "border-green-500"
              )}
              placeholder="0"
            />
            {isSaving && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-500" />
            )}
            {isSaved && !isSaving && (
              <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
        <div className="relative">
          <Label className="text-xs text-muted-foreground mb-1 block">{t('inventory.storage2')}</Label>
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={storage2 || ''}
              onChange={(e) => onChange(articleId, 'storage_2', e.target.value)}
              onFocus={(e) => e.target.select()}
              disabled={disabled}
              className={cn(
                "h-11 text-center text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-8",
                isSaving && "border-amber-400",
                isSaved && "border-green-500"
              )}
              placeholder="0"
            />
            {isSaving && (
              <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-amber-500" />
            )}
            {isSaved && !isSaving && (
              <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={storage1 || ''}
          onChange={(e) => onChange(articleId, 'storage_1', e.target.value)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={cn(
            "w-full text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-7",
            isSaving && "border-amber-400",
            isSaved && "border-green-500"
          )}
          placeholder="0"
        />
        {isSaving && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-amber-500" />
        )}
        {isSaved && !isSaving && (
          <Check className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-green-500" />
        )}
      </div>
    </>
  );
});
