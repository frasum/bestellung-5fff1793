import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

interface Supplier {
  id: string;
  name: string;
}

interface SupplierSelectionProps {
  suppliers: Supplier[];
  onSelect: (supplierId: string) => void;
  getArticleCount: (supplierId: string) => number;
}

export const SupplierSelection = ({
  suppliers,
  onSelect,
  getArticleCount,
}: SupplierSelectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">
        {t('simpleOrder.selectSupplier', 'เลือกผู้จำหน่าย / Lieferant wählen')}
      </h2>
      <div className="space-y-3">
        {suppliers.map((supplier) => (
          <Card
            key={supplier.id}
            className="p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
            onClick={() => onSelect(supplier.id)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{supplier.name}</h3>
              <span className="text-muted-foreground">
                {getArticleCount(supplier.id)} {t('simpleOrder.articles', 'รายการ / Artikel')}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
