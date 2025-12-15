import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface B2BArticle {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  base_price: number;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  sort_order: number;
}

interface B2BArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: B2BArticle | null;
  accountId: string;
  categories: string[];
  onSuccess: () => void;
}

const UNITS = ['Stk', 'kg', 'g', 'L', 'ml', 'Packung', 'Karton', 'Kiste', 'Flasche', 'Bund'];

const B2BArticleFormDialog = ({
  open,
  onOpenChange,
  article,
  accountId,
  categories,
  onSuccess,
}: B2BArticleFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('Stk');
  const [basePrice, setBasePrice] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (article) {
      setName(article.name);
      setDescription(article.description || '');
      setSku(article.sku || '');
      setUnit(article.unit);
      setBasePrice(article.base_price.toString());
      setCategory(article.category || '');
      setIsActive(article.is_active);
    } else {
      setName('');
      setDescription('');
      setSku('');
      setUnit('Stk');
      setBasePrice('');
      setCategory('');
      setNewCategory('');
      setIsActive(true);
    }
  }, [article, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = newCategory || category;
    const priceValue = parseFloat(basePrice.replace(',', '.')) || 0;

    try {
      if (article) {
        // Update
        const { error } = await supabase
          .from('supplier_b2b_articles')
          .update({
            name,
            description: description || null,
            sku: sku || null,
            unit,
            base_price: priceValue,
            category: finalCategory || null,
            is_active: isActive,
          })
          .eq('id', article.id);

        if (error) throw error;
        toast.success('Artikel aktualisiert');
      } else {
        // Insert
        const { error } = await supabase
          .from('supplier_b2b_articles')
          .insert({
            supplier_account_id: accountId,
            name,
            description: description || null,
            sku: sku || null,
            unit,
            base_price: priceValue,
            category: finalCategory || null,
            is_active: isActive,
          });

        if (error) throw error;
        toast.success('Artikel erstellt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error(error.message || 'Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Artikel bearbeiten' : 'Neuer Artikel'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Artikelname"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preis (€) *</Label>
              <Input
                id="price"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Einheit *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">Artikelnummer (SKU)</Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            {categories.length > 0 ? (
              <Select value={category} onValueChange={(val) => { setCategory(val); setNewCategory(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen oder neu anlegen" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <Input
              value={newCategory}
              onChange={(e) => { setNewCategory(e.target.value); setCategory(''); }}
              placeholder={categories.length > 0 ? "Oder neue Kategorie eingeben" : "Kategorie eingeben"}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Aktiv (sichtbar für Kunden)</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default B2BArticleFormDialog;
