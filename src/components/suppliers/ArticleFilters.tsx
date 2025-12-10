import { Search, ChevronsUpDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CategoryFilterDropdown } from '@/components/CategoryFilterDropdown';
import { Supplier } from '@/hooks/useSuppliers';

interface ArticleFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSuppliers: string[];
  onSupplierChange: (suppliers: string[]) => void;
  suppliers: Supplier[];
  supplierPopoverOpen: boolean;
  onSupplierPopoverChange: (open: boolean) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  articleCategories: string[];
  advancedViewEnabled: boolean;
  onAdvancedViewChange: (value: boolean) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  showAdvancedToggle?: boolean;
  recentlyActiveSuppliers?: Map<string, Date>;
}

export const ArticleFilters = ({
  searchQuery,
  onSearchChange,
  selectedSuppliers,
  onSupplierChange,
  suppliers,
  supplierPopoverOpen,
  onSupplierPopoverChange,
  selectedCategory,
  onCategoryChange,
  articleCategories,
  advancedViewEnabled,
  onAdvancedViewChange,
  hasFilters,
  onClearFilters,
  showAdvancedToggle = false,
  recentlyActiveSuppliers = new Map()
}: ArticleFiltersProps) => {
  const activeFilterCount = (selectedSuppliers.length > 0 ? 1 : 0) + (selectedCategory ? 1 : 0);

  return (
    <>
      {/* Mobile: Search + Filter Button */}
      <div className="flex gap-2 lg:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Artikel suchen..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <ChevronsUpDown className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-4 bg-popover border border-border z-50" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lieferanten</Label>
                <Popover open={supplierPopoverOpen} onOpenChange={onSupplierPopoverChange}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-card">
                      {selectedSuppliers.length === 0 
                        ? "Alle Lieferanten" 
                        : `${selectedSuppliers.length} ausgewählt`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 bg-popover border border-border z-[60]" align="start">
                    <Command>
                      <CommandInput placeholder="Lieferanten suchen..." />
                      <CommandList>
                        <CommandEmpty>Keine Lieferanten gefunden</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => {
                            if (selectedSuppliers.length === (suppliers?.length || 0)) {
                              onSupplierChange([]);
                            } else {
                              onSupplierChange(suppliers?.map(s => s.id) || []);
                            }
                          }}>
                            <Checkbox checked={selectedSuppliers.length === (suppliers?.length || 0) && suppliers?.length > 0} className="mr-2" />
                            Alle auswählen
                          </CommandItem>
                        </CommandGroup>
                        <CommandGroup>
                          {suppliers?.sort((a, b) => a.name.localeCompare(b.name)).map((supplier) => (
                            <CommandItem key={supplier.id} value={supplier.name} onSelect={() => {
                              onSupplierChange(
                                selectedSuppliers.includes(supplier.id)
                                  ? selectedSuppliers.filter(id => id !== supplier.id)
                                  : [...selectedSuppliers, supplier.id]
                              );
                            }}>
                              <Checkbox checked={selectedSuppliers.includes(supplier.id)} className="mr-2" />
                              {supplier.name}
                              {recentlyActiveSuppliers.has(supplier.id) && (
                                <span 
                                  className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2 shrink-0" 
                                  title="Kürzlich aktiv"
                                />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Kategorie</Label>
                <CategoryFilterDropdown 
                  value={selectedCategory} 
                  onValueChange={onCategoryChange}
                  articleCategories={articleCategories}
                />
              </div>
              {hasFilters && (
                <Button variant="outline" className="w-full" onClick={onClearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Filter zurücksetzen
                </Button>
              )}
              {showAdvancedToggle && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <Label htmlFor="mobile-advanced-view" className="text-sm cursor-pointer">Mehrfachauswahl</Label>
                  <Switch id="mobile-advanced-view" checked={advancedViewEnabled} onCheckedChange={onAdvancedViewChange} />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop: Full Filter Row */}
      <div className="hidden lg:flex flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Artikel suchen..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        <Popover open={supplierPopoverOpen} onOpenChange={onSupplierPopoverChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-56 justify-between bg-card">
              {selectedSuppliers.length === 0 
                ? "Alle Lieferanten" 
                : `${selectedSuppliers.length} Lieferant${selectedSuppliers.length > 1 ? 'en' : ''}`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 bg-popover border border-border z-50" align="start">
            <Command>
              <CommandInput placeholder="Lieferanten suchen..." />
              <CommandList>
                <CommandEmpty>Keine Lieferanten gefunden</CommandEmpty>
                <CommandGroup>
                  <CommandItem onSelect={() => {
                    if (selectedSuppliers.length === (suppliers?.length || 0)) {
                      onSupplierChange([]);
                    } else {
                      onSupplierChange(suppliers?.map(s => s.id) || []);
                    }
                  }}>
                    <Checkbox checked={selectedSuppliers.length === (suppliers?.length || 0) && suppliers?.length > 0} className="mr-2" />
                    Alle auswählen
                  </CommandItem>
                </CommandGroup>
                <CommandGroup>
                  {suppliers?.sort((a, b) => a.name.localeCompare(b.name)).map((supplier) => (
                    <CommandItem key={supplier.id} value={supplier.name} onSelect={() => {
                      onSupplierChange(
                        selectedSuppliers.includes(supplier.id)
                          ? selectedSuppliers.filter(id => id !== supplier.id)
                          : [...selectedSuppliers, supplier.id]
                      );
                    }}>
                      <Checkbox checked={selectedSuppliers.includes(supplier.id)} className="mr-2" />
                      {supplier.name}
                      {recentlyActiveSuppliers.has(supplier.id) && (
                        <span 
                          className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2 shrink-0" 
                          title="Kürzlich aktiv"
                        />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <CategoryFilterDropdown 
          value={selectedCategory} 
          onValueChange={onCategoryChange}
          articleCategories={articleCategories}
        />
        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={onClearFilters} title="Filter zurücksetzen">
            <X className="w-4 h-4" />
          </Button>
        )}
        {showAdvancedToggle && (
          <div className="flex items-center gap-2">
            <Switch id="advanced-view" checked={advancedViewEnabled} onCheckedChange={onAdvancedViewChange} />
            <Label htmlFor="advanced-view" className="text-sm cursor-pointer whitespace-nowrap">Mehrfachauswahl</Label>
          </div>
        )}
      </div>
    </>
  );
};
