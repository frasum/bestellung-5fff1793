import { Search, Printer, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TOP_CATEGORIES } from './constants';

interface SupplierFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  topCategoryFilter: string;
  onTopCategoryChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  articleCategories: string[];
  multiSelectEnabled: boolean;
  onMultiSelectChange: (value: boolean) => void;
  selectedCount: number;
  onPrintCombined: () => void;
  showMultiSelectToggle?: boolean;
}

export const SupplierFilters = ({
  searchQuery,
  onSearchChange,
  topCategoryFilter,
  onTopCategoryChange,
  categoryFilter,
  onCategoryChange,
  articleCategories,
  multiSelectEnabled,
  onMultiSelectChange,
  selectedCount,
  onPrintCombined,
  showMultiSelectToggle = false
}: SupplierFiltersProps) => {
  const hasActiveFilters = topCategoryFilter !== 'all' || categoryFilter !== 'all';

  return (
    <>
      {/* Mobile: Search + Filter Popover */}
      <div className="flex gap-2 lg:hidden w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Artikel suchen..."
            value={searchQuery} 
            onChange={e => onSearchChange(e.target.value)} 
            className="pl-10 h-11" 
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative">
              <SlidersHorizontal className="w-4 h-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 space-y-4" align="end">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Oberkategorie</Label>
              <Select value={topCategoryFilter} onValueChange={onTopCategoryChange}>
                <SelectTrigger className="w-full bg-card h-10">
                  <SelectValue placeholder="Oberkategorie" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="all">Alle Oberkategorien</SelectItem>
                  {TOP_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Hauptkategorie</Label>
              <Select value={categoryFilter} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-full bg-card h-10">
                  <SelectValue placeholder="Hauptkategorie" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {articleCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {showMultiSelectToggle && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Switch id="multi-select-mobile" checked={multiSelectEnabled} onCheckedChange={onMultiSelectChange} />
                <Label htmlFor="multi-select-mobile" className="text-sm cursor-pointer">Bestelllisten drucken</Label>
              </div>
            )}
            {multiSelectEnabled && selectedCount > 0 && (
              <Button onClick={onPrintCombined} variant="secondary" className="w-full h-10">
                <Printer className="w-4 h-4 mr-2" />
                {selectedCount} Listen drucken
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop: Full Filter Row */}
      <div className="hidden lg:flex flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Artikel suchen..." value={searchQuery} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        {showMultiSelectToggle && (
          <div className="flex items-center gap-2">
            <Switch id="multi-select" checked={multiSelectEnabled} onCheckedChange={onMultiSelectChange} />
            <Label htmlFor="multi-select" className="text-sm cursor-pointer whitespace-nowrap">Bestelllisten drucken</Label>
          </div>
        )}
        {multiSelectEnabled && selectedCount > 0 && (
          <Button onClick={onPrintCombined} variant="secondary">
            <Printer className="w-4 h-4 mr-2" />
            {selectedCount} Listen drucken
          </Button>
        )}
      </div>
    </>
  );
};
