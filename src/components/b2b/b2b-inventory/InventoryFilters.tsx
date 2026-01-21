import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Vendor } from './types';

interface InventoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  vendorFilter: string;
  onVendorFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  vendors: Vendor[] | undefined;
  categories: string[];
}

export const InventoryFilters = React.memo(function InventoryFilters({
  searchQuery,
  onSearchChange,
  vendorFilter,
  onVendorFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  vendors,
  categories,
}: InventoryFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Select value={vendorFilter} onValueChange={onVendorFilterChange}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Alle Lieferanten" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Lieferanten</SelectItem>
          {vendors?.map((vendor) => (
            <SelectItem key={vendor.id} value={vendor.id}>
              {vendor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue placeholder="Alle Kategorien" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle Kategorien</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

InventoryFilters.displayName = 'InventoryFilters';
