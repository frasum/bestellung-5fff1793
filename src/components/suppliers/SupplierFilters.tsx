import { Search, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TOP_CATEGORIES } from './constants';

interface SupplierFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  topCategoryFilter: string;
  onTopCategoryChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  existingCategories: string[];
  multiSelectEnabled: boolean;
  onMultiSelectChange: (value: boolean) => void;
  selectedCount: number;
  onPrintCombined: () => void;
}

export const SupplierFilters = ({
  searchQuery,
  onSearchChange,
  topCategoryFilter,
  onTopCategoryChange,
  categoryFilter,
  onCategoryChange,
  existingCategories,
  multiSelectEnabled,
  onMultiSelectChange,
  selectedCount,
  onPrintCombined
}: SupplierFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Lieferanten suchen..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
      </div>
      <Select value={topCategoryFilter} onValueChange={onTopCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px] bg-card">
          <SelectValue placeholder="Oberkategorie" />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border z-50">
          <SelectItem value="all">Alle Oberkategorien</SelectItem>
          {TOP_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[180px] bg-card">
          <SelectValue placeholder="Hauptkategorie" />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border z-50">
          <SelectItem value="all">Alle Kategorien</SelectItem>
          {existingCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Switch id="multi-select" checked={multiSelectEnabled} onCheckedChange={onMultiSelectChange} />
        <Label htmlFor="multi-select" className="text-sm cursor-pointer whitespace-nowrap">Mehrfachauswahl</Label>
      </div>
      {multiSelectEnabled && selectedCount > 0 && (
        <Button onClick={onPrintCombined} variant="secondary">
          <Printer className="w-4 h-4 mr-2" />
          {selectedCount} Listen drucken
        </Button>
      )}
    </div>
  );
};
