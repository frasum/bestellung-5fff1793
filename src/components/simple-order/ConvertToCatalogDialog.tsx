import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';
import { useCreateArticle, Article } from '@/hooks/useArticles';
import { toast } from 'sonner';
import { DatabaseZap, Loader2 } from 'lucide-react';
import { FreeCartItem } from '@/contexts/CartContext';

interface ConvertToCatalogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  freeItem: FreeCartItem | null;
  supplierName: string;
  onSuccess: (article: Article) => void;
}

export function ConvertToCatalogDialog({
  open,
  onOpenChange,
  freeItem,
  supplierName,
  onSuccess,
}: ConvertToCatalogDialogProps) {
  const { t } = useTranslation();
  const { data: categories = [] } = useCategories();
  const createArticle = useCreateArticle();
  
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [originCountry, setOriginCountry] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!freeItem) return;
    
    const priceValue = parseFloat(price.replace(',', '.'));
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Bitte gib einen gültigen Preis ein');
      return;
    }

    try {
      const newArticle = await createArticle.mutateAsync({
        name: freeItem.name,
        unit: freeItem.unit,
        price: priceValue,
        supplier_id: freeItem.supplier_id,
        category: category || undefined,
        description: description || undefined,
        origin_country: originCountry || undefined,
      });

      toast.success(`"${freeItem.name}" wurde in den Katalog aufgenommen`);
      onSuccess(newArticle);
      onOpenChange(false);
      
      // Reset form
      setPrice('');
      setCategory('');
      setDescription('');
      setOriginCountry('');
    } catch (error) {
      console.error('Error creating article:', error);
      toast.error('Fehler beim Erstellen des Artikels');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPrice('');
      setCategory('');
      setDescription('');
      setOriginCountry('');
    }
    onOpenChange(open);
  };

  if (!freeItem) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DatabaseZap className="h-5 w-5 text-primary" />
            In Katalog übernehmen
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="font-medium">{freeItem.name}</p>
            <p className="text-sm text-muted-foreground">
              {supplierName} • {freeItem.unit}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-price">Preis (€) *</Label>
            <Input
              id="convert-price"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-category">Kategorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="convert-category">
                <SelectValue placeholder="Kategorie auswählen (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-description">Beschreibung</Label>
            <Input
              id="convert-description"
              type="text"
              placeholder="Optional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {category.toLowerCase().includes('wein') && (
            <div className="space-y-2">
              <Label htmlFor="convert-origin-country">Herkunftsland</Label>
              <Input
                id="convert-origin-country"
                type="text"
                placeholder="z.B. Italien, Frankreich, Spanien"
                value={originCountry}
                onChange={(e) => setOriginCountry(e.target.value)}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={createArticle.isPending}>
              {createArticle.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
