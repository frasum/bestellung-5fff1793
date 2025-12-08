import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

interface Category {
  id: string;
  name: string;
}

interface PendingChange {
  id: string;
  article_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  created_at: string;
}

interface SupplierCategorySelectProps {
  value: string;
  categories: Category[];
  onChange: (value: string) => void;
  onCreateCategory: (name: string) => Promise<void>;
  hasPending?: boolean;
  pendingInfo?: PendingChange | null;
  className?: string;
}

export function SupplierCategorySelect({
  value,
  categories,
  onChange,
  onCreateCategory,
  hasPending,
  pendingInfo,
  className,
}: SupplierCategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreating(true);
    try {
      await onCreateCategory(newCategoryName.trim());
      onChange(newCategoryName.trim());
      setNewCategoryName('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between font-normal",
              hasPending && "border-amber-500",
              className
            )}
          >
            <span className="truncate">{value || '—'}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0 z-50" align="start">
          <Command>
            <CommandInput placeholder="Kategorie suchen..." />
            <CommandList>
              <CommandEmpty>Keine Kategorie gefunden.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={(currentValue) => {
                      onChange(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <div className="p-2 space-y-2">
                  <Input
                    placeholder="Neue Kategorie..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                    className="h-8"
                  />
                  <Button
                    size="sm"
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || isCreating}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {pendingInfo && (
        <div className="text-xs">
          <span className="text-amber-600">Ausstehend</span>
          <span className="text-muted-foreground ml-1">
            (vorher: {pendingInfo.old_value || '—'})
          </span>
        </div>
      )}
    </div>
  );
}
