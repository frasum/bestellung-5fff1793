import { useState } from 'react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, ChevronsUpDown, Plus, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, Category } from '@/hooks/useCategories';

interface CategoryFilterDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  articleCategories?: string[];
}

export function CategoryFilterDropdown({ value, onValueChange, articleCategories = [] }: CategoryFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  const { data: dbCategories } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  // Combine DB categories with article-derived categories and sort alphabetically
  const dbCategoryNames = dbCategories?.map(c => c.name) || [];
  const allCategoryNames = [...new Set([...dbCategoryNames, ...articleCategories])].sort((a, b) => 
    a.localeCompare(b, 'de')
  );

  const filteredCategories = allCategoryNames.filter(cat => 
    cat.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (cat: string) => {
    onValueChange(cat);
    setOpen(false);
    setSearchQuery('');
  };

  const handleStartEdit = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setEditValue(category.name);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editValue.trim()) return;
    await updateCategory.mutateAsync({ id: editingCategory.id, name: editValue.trim() });
    setEditingCategory(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setEditValue('');
  };

  const handleStartDelete = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCategory(category);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    await deleteCategory.mutateAsync(deletingCategory.id);
    if (value === deletingCategory.name) {
      onValueChange('all');
    }
    setDeletingCategory(null);
  };

  const handleAddNew = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory.mutateAsync(newCategoryName.trim());
    setNewCategoryName('');
    setIsAddingNew(false);
  };

  const getDbCategory = (name: string): Category | undefined => {
    return dbCategories?.find(c => c.name === name);
  };

  const displayValue = value === 'all' ? 'Alle Kategorien' : value;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-48 justify-between bg-card"
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 bg-popover border border-border z-50" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Kategorie suchen..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                <p className="text-sm text-muted-foreground py-2">Keine Kategorie gefunden</p>
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => handleSelect('all')}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === 'all' ? "opacity-100" : "opacity-0")} />
                  Alle Kategorien
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Kategorien">
                {filteredCategories.map((cat) => {
                  const dbCategory = getDbCategory(cat);
                  const isEditing = editingCategory?.name === cat;
                  
                  if (isEditing && dbCategory) {
                    return (
                      <div key={cat} className="flex items-center gap-1 px-2 py-1.5">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-7 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={() => handleSelect(cat)}
                      className="group"
                    >
                      <Check className={cn("mr-2 h-4 w-4 shrink-0", value === cat ? "opacity-100" : "opacity-0")} />
                      <span className="flex-1 truncate">{cat}</span>
                      {dbCategory && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => handleStartEdit(dbCategory, e)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={(e) => handleStartDelete(dbCategory, e)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                {isAddingNew ? (
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Neue Kategorie..."
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNew();
                        if (e.key === 'Escape') {
                          setIsAddingNew(false);
                          setNewCategoryName('');
                        }
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleAddNew}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7" 
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewCategoryName('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <CommandItem onSelect={() => setIsAddingNew(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Neue Kategorie hinzufügen
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategorie löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Kategorie "{deletingCategory?.name}" wirklich löschen? 
              Artikel mit dieser Kategorie behalten ihre Zuordnung, aber die Kategorie 
              wird aus der Verwaltung entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
