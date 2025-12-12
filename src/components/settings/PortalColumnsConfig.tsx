import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PortalColumnKey, PORTAL_COLUMN_OPTIONS, DEFAULT_VISIBLE_COLUMNS } from '@/hooks/useSupplierPortalSettings';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface PortalColumnsConfigProps {
  visibleColumns: PortalColumnKey[];
  onChange: (columns: PortalColumnKey[]) => void;
}

export function PortalColumnsConfig({ visibleColumns, onChange }: PortalColumnsConfigProps) {
  const { t } = useTranslation();

  const toggleColumn = (key: PortalColumnKey) => {
    if (visibleColumns.includes(key)) {
      // Don't allow removing all columns - keep at least price
      if (visibleColumns.length === 1 && key === 'price') return;
      onChange(visibleColumns.filter(c => c !== key));
    } else {
      // Add column in the standard order
      const orderedColumns = PORTAL_COLUMN_OPTIONS
        .map(opt => opt.key)
        .filter(k => visibleColumns.includes(k) || k === key);
      onChange(orderedColumns);
    }
  };

  const handleSelectAll = () => {
    onChange(PORTAL_COLUMN_OPTIONS.map(opt => opt.key));
  };

  const handleSelectDefault = () => {
    onChange([...DEFAULT_VISIBLE_COLUMNS]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          {t('settings.visibleColumns', 'Sichtbare Spalten')}
        </p>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={handleSelectDefault}
            className="text-muted-foreground hover:text-foreground underline"
          >
            {t('common.default', 'Standard')}
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-muted-foreground hover:text-foreground underline"
          >
            {t('common.all', 'Alle')}
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {PORTAL_COLUMN_OPTIONS.map((option) => {
          const isChecked = visibleColumns.includes(option.key);
          const isRequired = option.key === 'price' && visibleColumns.length === 1;
          
          return (
            <div
              key={option.key}
              className="flex items-center gap-3 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              <Checkbox
                id={`col-${option.key}`}
                checked={isChecked}
                onCheckedChange={() => toggleColumn(option.key)}
                disabled={isRequired}
              />
              <Label
                htmlFor={`col-${option.key}`}
                className="flex-1 cursor-pointer text-sm"
              >
                {option.label}
              </Label>
              {!isChecked && (
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground/50" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {t('settings.visibleColumnsDesc', 'Wählen Sie aus, welche Artikelinformationen Lieferanten im Portal sehen und bearbeiten können.')}
      </p>
    </div>
  );
}
