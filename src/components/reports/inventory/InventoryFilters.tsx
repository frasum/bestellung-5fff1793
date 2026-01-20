import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Filter } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
}

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  supplierFilter: string;
  onSupplierFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  suppliers: Supplier[];
  categories: string[];
}

export function InventoryFilters({
  searchQuery,
  onSearchChange,
  supplierFilter,
  onSupplierFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  suppliers,
  categories,
}: InventoryFiltersProps) {
  const { t } = useTranslation();
  
  const activeFilterCount = (supplierFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0);
  
  return (
    <>
      {/* Filters - Desktop */}
      <div className="hidden sm:flex flex-col sm:flex-row gap-4 mt-4 pb-4 border-b border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('inventory.searchArticles')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-background border-border"
          />
        </div>
        <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
          <SelectTrigger className="w-full sm:w-48 h-9 bg-background border-border">
            <SelectValue placeholder={t('inventory.filterBySupplier')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inventory.allSuppliers')}</SelectItem>
            {suppliers.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-full sm:w-48 h-9 bg-background border-border">
            <SelectValue placeholder={t('inventory.filterByCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters - Mobile */}
      <div className="flex sm:hidden gap-2 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 relative flex-shrink-0">
              <Filter className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t('inventory.supplier')}</Label>
                <Select value={supplierFilter} onValueChange={onSupplierFilterChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('inventory.allSuppliers')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('inventory.allSuppliers')}</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('inventory.category')}</Label>
                <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t('inventory.allCategories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('inventory.allCategories')}</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {activeFilterCount > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    onSupplierFilterChange('all');
                    onCategoryFilterChange('all');
                  }}
                >
                  {t('common.resetFilters')}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
