import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

interface Supplier {
  id: string;
  name: string;
  sort_order?: number;
}

interface SupplierSelectionProps {
  suppliers: Supplier[];
  onSelect: (supplierId: string) => void;
  getArticleCount: (supplierId: string) => number;
}

// Sort suppliers: by sort_order if set, otherwise alphabetically
const sortSuppliers = (suppliers: Supplier[]) => {
  return [...suppliers].sort((a, b) => {
    const orderA = a.sort_order || 0;
    const orderB = b.sort_order || 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name, 'de');
  });
};

export const SupplierSelection = ({
  suppliers,
  onSelect,
  getArticleCount,
}: SupplierSelectionProps) => {
  const { t } = useTranslation();
  const sortedSuppliers = sortSuppliers(suppliers);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">
        {t('simpleOrder.selectSupplier', 'เลือกผู้จำหน่าย / Lieferant wählen')}
      </h2>
      <div className="space-y-3">
        {sortedSuppliers.map((supplier) => (
          <Card
            key={supplier.id}
            className="p-5 min-h-[72px] cursor-pointer hover:shadow-md transition-all active:scale-[0.98] touch-manipulation"
            onClick={() => onSelect(supplier.id)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{supplier.name}</h3>
              <span className="text-base text-muted-foreground font-medium">
                {getArticleCount(supplier.id)} {t('simpleOrder.articles', 'Artikel')}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
