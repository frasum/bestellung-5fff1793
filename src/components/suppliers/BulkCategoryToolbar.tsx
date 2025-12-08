import { useState } from 'react';
import { Tags, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

interface BulkCategoryToolbarProps {
  selectedCount: number;
  categories: string[];
  onAssignCategory: (category: string | null) => void;
  onClearSelection: () => void;
}

export const BulkCategoryToolbar = ({
  selectedCount,
  categories,
  onAssignCategory,
  onClearSelection
}: BulkCategoryToolbarProps) => {
  const [open, setOpen] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const handleAssign = (category: string | null) => {
    onAssignCategory(category);
    setOpen(false);
    setCustomCategory('');
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
      <span className="text-sm font-medium">{selectedCount} Artikel ausgewählt</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Tags className="w-4 h-4 mr-2" />
            Kategorie zuweisen
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-popover border border-border z-50" align="start">
          <Command>
            <CommandInput placeholder="Kategorie suchen oder eingeben..." value={customCategory} onValueChange={setCustomCategory} />
            <CommandList>
              <CommandEmpty>
                {customCategory && (
                  <button type="button" className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent cursor-pointer" onClick={() => handleAssign(customCategory)}>
                    "{customCategory}" hinzufügen
                  </button>
                )}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem value="__remove__" onSelect={() => handleAssign(null)} className="text-destructive">
                  Kategorie entfernen
                </CommandItem>
                {categories.map((category) => (
                  <CommandItem key={category} value={category} onSelect={() => handleAssign(category)}>
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        Auswahl aufheben
      </Button>
    </div>
  );
};
