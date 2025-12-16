import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import type { CustomerVendorArticle } from './CustomerVendorArticlesTab';

interface CustomerVendorArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: CustomerVendorArticle | null;
  customerId: string;
  vendors: { id: string; name: string }[];
  onSuccess: () => void;
}

const CustomerVendorArticleFormDialog = ({
  open,
  onOpenChange,
  article,
  customerId,
  vendors,
  onSuccess,
}: CustomerVendorArticleFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('Stk');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (article) {
      setVendorId(article.vendor_id);
      setName(article.name);
      setDescription(article.description || '');
      setSku(article.sku || '');
      setCategory(article.category || '');
      setPrice(article.price.toString());
      setUnit(article.unit);
      setIsActive(article.is_active);
    } else {
      setVendorId(vendors[0]?.id || '');
      setName('');
      setDescription('');
      setSku('');
      setCategory('');
      setPrice('');
      setUnit('Stk');
      setIsActive(true);
    }
  }, [article, vendors, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }
    if (!vendorId) {
      toast.error('Bitte wählen Sie einen Lieferanten');
      return;
    }

    setLoading(true);

    try {
      const articleData = {
        customer_id: customerId,
        vendor_id: vendorId,
        name: name.trim(),
        description: description.trim() || null,
        sku: sku.trim() || null,
        category: category.trim() || null,
        price: parseFloat(price) || 0,
        unit: unit.trim() || 'Stk',
        is_active: isActive,
      };

      if (article) {
        const { error } = await supabase
          .from('b2b_customer_vendor_articles')
          .update(articleData)
          .eq('id', article.id);

        if (error) throw error;
        toast.success('Artikel aktualisiert');
      } else {
        const { error } = await supabase
          .from('b2b_customer_vendor_articles')
          .insert(articleData);

        if (error) throw error;
        toast.success('Artikel hinzugefügt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Artikel bearbeiten' : 'Neuen Artikel hinzufügen'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Lieferant *</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Lieferant wählen" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preis (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Stk"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">Artikelnummer</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="z.B. Gemüse"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Aktiv</Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {article ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerVendorArticleFormDialog;
