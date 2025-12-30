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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { X, Check, Loader2 } from 'lucide-react';
import type { B2BVendorArticle } from './B2BVendorArticlesTab';
import type { B2BVendor } from './B2BVendorsTab';

interface B2BVendorArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: B2BVendorArticle | null;
  accountId: string;
  vendors: B2BVendor[];
  categories: string[];
  onSuccess: () => void;
}

const UNITS = ['Stk', 'kg', 'g', 'l', 'ml', 'Karton', 'Kiste', 'Palette', 'Bund', 'Pkg'];

const B2BVendorArticleFormDialog = ({
  open,
  onOpenChange,
  article,
  accountId,
  vendors,
  categories,
  onSuccess,
}: B2BVendorArticleFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendor_id: '',
    name: '',
    description: '',
    price: '',
    unit: 'Stk',
    sku: '',
    category: '',
    is_active: true,
  });

  useEffect(() => {
    if (article) {
      setFormData({
        vendor_id: article.vendor_id,
        name: article.name,
        description: article.description || '',
        price: article.price.toString(),
        unit: article.unit,
        sku: article.sku || '',
        category: article.category || '',
        is_active: article.is_active,
      });
    } else {
      setFormData({
        vendor_id: vendors[0]?.id || '',
        name: '',
        description: '',
        price: '',
        unit: 'Stk',
        sku: '',
        category: '',
        is_active: true,
      });
    }
  }, [article, open, vendors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }
    if (!formData.vendor_id) {
      toast.error('Bitte wählen Sie einen Lieferanten');
      return;
    }

    setLoading(true);
    try {
      const data = {
        supplier_account_id: accountId,
        vendor_id: formData.vendor_id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price) || 0,
        unit: formData.unit,
        sku: formData.sku.trim() || null,
        category: formData.category.trim() || null,
        is_active: formData.is_active,
      };

      if (article) {
        const { error } = await supabase
          .from('b2b_supplier_vendor_articles')
          .update(data)
          .eq('id', article.id);

        if (error) throw error;
        toast.success('Artikel aktualisiert');
      } else {
        const { error } = await supabase
          .from('b2b_supplier_vendor_articles')
          .insert(data);

        if (error) throw error;
        toast.success('Artikel hinzugefügt');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Artikel bearbeiten' : 'Neuen Artikel hinzufügen'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Lieferant *</Label>
            <Select
              value={formData.vendor_id}
              onValueChange={(value) => setFormData({ ...formData, vendor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Lieferant wählen" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Artikelname *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Tomaten San Marzano"
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
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Einheit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sku">Artikelnummer (SKU)</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="z.B. Gemüse, Obst, ..."
              list="categories"
            />
            <datalist id="categories">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Aktiv</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex justify-center items-center gap-6 pt-4">
            <Button 
              type="button" 
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-2 text-muted-foreground hover:text-foreground"
              onClick={() => onOpenChange(false)}
              title="Abbrechen"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button 
              type="submit" 
              size="icon"
              className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={loading}
              title="Speichern"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default B2BVendorArticleFormDialog;
