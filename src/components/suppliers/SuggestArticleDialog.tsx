import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus } from 'lucide-react';
import { SupplierUnitSelect } from './SupplierUnitSelect';
import { SupplierCategorySelect } from './SupplierCategorySelect';

interface Unit {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface SuggestArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (article: {
    name: string;
    sku: string | null;
    description: string | null;
    unit: string;
    price: number;
    category: string | null;
    comment: string | null;
  }) => Promise<void>;
  units: Unit[];
  categories: Category[];
  onCreateUnit: (name: string) => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
}

export const SuggestArticleDialog = ({
  open,
  onOpenChange,
  onSubmit,
  units,
  categories,
  onCreateUnit,
  onCreateCategory,
}: SuggestArticleDialogProps) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('Stk');
  const [priceInput, setPriceInput] = useState('');
  const [category, setCategory] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setSku('');
    setDescription('');
    setUnit('Stk');
    setPriceInput('');
    setCategory('');
    setComment('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const priceValue = priceInput.replace(',', '.');
      const parsedPrice = parseFloat(priceValue) || 0;

      await onSubmit({
        name: name.trim(),
        sku: sku.trim() || null,
        description: description.trim() || null,
        unit,
        price: parsedPrice,
        category: category || null,
        comment: comment.trim() || null,
      });

      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Plus className="h-5 w-5 shrink-0" />
            Neuen Artikel vorschlagen
          </DialogTitle>
          <DialogDescription>
            Schlagen Sie einen neuen Artikel vor. Er wird zur Genehmigung eingereicht.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Artikelname *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Bio-Tomaten"
              required
              className="h-11 sm:h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Artikelnummer</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="optional"
                className="h-11 sm:h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preis (€)</Label>
              <Input
                id="price"
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0,00"
                className="h-11 sm:h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>Einheit</Label>
              <SupplierUnitSelect
                value={unit}
                units={units}
                onChange={setUnit}
                onCreateUnit={onCreateUnit}
                hasPending={false}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <SupplierCategorySelect
                value={category}
                categories={categories}
                onChange={setCategory}
                onCreateCategory={onCreateCategory}
                hasPending={false}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="optional"
              className="h-11 sm:h-9"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Kommentar (optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Warum schlagen Sie diesen Artikel vor?"
              rows={2}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-10 sm:h-9">
              Abbrechen
            </Button>
            <Button type="submit" disabled={!name.trim() || submitting} className="w-full sm:w-auto h-10 sm:h-9">
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Vorschlagen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
