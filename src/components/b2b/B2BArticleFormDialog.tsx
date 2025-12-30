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
import { X, Check, Loader2 } from 'lucide-react';

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
  supplier_id?: string | null;
  source_article_id?: string | null;
}

interface SourceArticleData {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  category: string | null;
  organization_id: string;
  supplier_id: string;
}

interface B2BSupplier {
  id: string;
  name: string;
}

interface B2BArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: B2BArticle | null;
  accountId: string;
  categories: string[];
  suppliers: B2BSupplier[];
  onSuccess: () => void;
}

const UNITS = ['Stk', 'kg', 'g', 'L', 'ml', 'Packung', 'Karton', 'Kiste', 'Flasche', 'Bund'];

const B2BArticleFormDialog = ({
  open,
  onOpenChange,
  article,
  accountId,
  categories,
  suppliers,
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
  const [supplierId, setSupplierId] = useState<string>('');
  const [sourceArticle, setSourceArticle] = useState<SourceArticleData | null>(null);

  // Load source article data if linked
  useEffect(() => {
    const loadSourceArticle = async () => {
      if (article?.source_article_id) {
        const { data } = await supabase
          .from('articles')
          .select('id, name, description, unit, price, category, organization_id, supplier_id')
          .eq('id', article.source_article_id)
          .single();
        
        if (data) {
          setSourceArticle(data);
        }
      } else {
        setSourceArticle(null);
      }
    };

    if (open && article) {
      loadSourceArticle();
    }
  }, [open, article]);

  useEffect(() => {
    if (article) {
      setName(article.name);
      setDescription(article.description || '');
      setSku(article.sku || '');
      setUnit(article.unit);
      setBasePrice(article.base_price.toString());
      setCategory(article.category || '');
      setIsActive(article.is_active);
      setSupplierId(article.supplier_id || suppliers[0]?.id || '');
    } else {
      setName('');
      setDescription('');
      setSku('');
      setUnit('Stk');
      setBasePrice('');
      setCategory('');
      setNewCategory('');
      setIsActive(true);
      setSupplierId(suppliers[0]?.id || '');
      setSourceArticle(null);
    }
  }, [article, open, suppliers]);

  // Create supplier_article_changes entries for syncing to Bestellung.pro
  const createChangeEntries = async (priceValue: number, finalCategory: string | null) => {
    if (!sourceArticle || !article?.source_article_id) return;

    const changes: { field_name: string; old_value: string | null; new_value: string | null }[] = [];

    // Compare fields and track changes
    if (name !== sourceArticle.name) {
      changes.push({ field_name: 'name', old_value: sourceArticle.name, new_value: name });
    }
    if ((description || null) !== (sourceArticle.description || null)) {
      changes.push({ field_name: 'description', old_value: sourceArticle.description, new_value: description || null });
    }
    if (priceValue !== sourceArticle.price) {
      changes.push({ field_name: 'price', old_value: sourceArticle.price.toString(), new_value: priceValue.toString() });
    }
    if (unit !== sourceArticle.unit) {
      changes.push({ field_name: 'unit', old_value: sourceArticle.unit, new_value: unit });
    }
    if ((finalCategory || null) !== (sourceArticle.category || null)) {
      changes.push({ field_name: 'category', old_value: sourceArticle.category, new_value: finalCategory });
    }

    if (changes.length === 0) return;

    // Insert change entries
    const changeEntries = changes.map(change => ({
      article_id: article.source_article_id!,
      supplier_id: sourceArticle.supplier_id,
      organization_id: sourceArticle.organization_id,
      field_name: change.field_name,
      old_value: change.old_value,
      new_value: change.new_value,
      status: 'pending',
    }));

    const { error } = await supabase
      .from('supplier_article_changes')
      .insert(changeEntries);

    if (error) {
      console.error('Error creating change entries:', error);
    } else {
      toast.info(`${changes.length} Änderung(en) zur Genehmigung an Bestellung.pro gesendet`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalCategory = newCategory || category;
    const priceValue = parseFloat(basePrice.replace(',', '.')) || 0;

    try {
      if (article) {
        // Update B2B article
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
            supplier_id: supplierId || null,
          })
          .eq('id', article.id);

        if (error) throw error;

        // If linked to Bestellung.pro, create change entries for approval
        if (article.source_article_id && sourceArticle) {
          await createChangeEntries(priceValue, finalCategory);
        }

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
            supplier_id: supplierId || null,
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
          {suppliers.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="supplier">Lieferant *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Lieferant wählen" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

export default B2BArticleFormDialog;
