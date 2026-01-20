import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, Download, CheckCircle2 } from 'lucide-react';

interface SourceArticle {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  price: number;
  image_url: string | null;
  category: string | null;
}

interface B2BSupplier {
  id: string;
  name: string;
}

interface B2BArticleImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  linkedSupplierId: string | null;
  suppliers: B2BSupplier[];
  defaultSupplierId?: string;
  onSuccess: () => void;
}

const B2BArticleImportDialog = ({
  open,
  onOpenChange,
  accountId,
  linkedSupplierId,
  suppliers,
  defaultSupplierId,
  onSuccess,
}: B2BArticleImportDialogProps) => {
  const [articles, setArticles] = useState<SourceArticle[]>([]);
  const [existingSkus, setExistingSkus] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(defaultSupplierId || suppliers[0]?.id || '');

  useEffect(() => {
    if (open && linkedSupplierId) {
      loadArticles();
      loadExistingSkus();
    }
    if (open && defaultSupplierId) {
      setSelectedSupplierId(defaultSupplierId);
    } else if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [open, linkedSupplierId, suppliers, defaultSupplierId]);

  const loadArticles = async () => {
    if (!linkedSupplierId) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, name, description, sku, unit, price, image_url, category')
        .eq('supplier_id', linkedSupplierId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setArticles(data || []);
    } catch (error: unknown) {
      console.error('Error loading articles:', error instanceof Error ? error.message : error);
      toast.error('Fehler beim Laden der Artikel');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingSkus = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_b2b_articles')
        .select('sku')
        .eq('supplier_account_id', accountId)
        .not('sku', 'is', null);

      if (error) throw error;
      setExistingSkus(new Set((data || []).map(a => a.sku).filter(Boolean)));
    } catch (error) {
      console.error('Error loading existing SKUs:', error);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.name.toLowerCase().includes(search.toLowerCase()) ||
    article.sku?.toLowerCase().includes(search.toLowerCase()) ||
    article.category?.toLowerCase().includes(search.toLowerCase())
  );

  const isAlreadyImported = (article: SourceArticle) => {
    return article.sku ? existingSkus.has(article.sku) : false;
  };

  const importableArticles = filteredArticles.filter(a => !isAlreadyImported(a));

  const toggleArticle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const importableIds = importableArticles.map(a => a.id);
    setSelectedIds(new Set(importableIds));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;

    setImporting(true);
    try {
      const selectedArticles = articles.filter(a => selectedIds.has(a.id));
      
      const articlesToImport = selectedArticles.map(article => ({
        supplier_account_id: accountId,
        supplier_id: selectedSupplierId || null,
        name: article.name,
        description: article.description,
        sku: article.sku,
        unit: article.unit,
        base_price: article.price,
        image_url: article.image_url,
        category: article.category,
        is_active: true,
        source_article_id: article.id, // Link to original Bestellung.pro article
      }));

      const { error } = await supabase
        .from('supplier_b2b_articles')
        .insert(articlesToImport as any);

      if (error) throw error;

      toast.success(`${selectedArticles.length} Artikel importiert`);
      setSelectedIds(new Set());
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Error importing articles:', error instanceof Error ? error.message : error);
      toast.error('Fehler beim Importieren');
    } finally {
      setImporting(false);
    }
  };

  if (!linkedSupplierId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Artikel importieren</DialogTitle>
            <DialogDescription>
              Um Artikel zu importieren, verknüpfen Sie bitte zuerst Ihren Bestellung.pro Lieferanten in den Einstellungen.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Artikel von Bestellung.pro importieren
          </DialogTitle>
          <DialogDescription>
            Wählen Sie die Artikel aus, die Sie in Ihr B2B-Portal importieren möchten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search & Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Alle auswählen
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Keine
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{filteredArticles.length} Artikel verfügbar</span>
            <span>{selectedIds.size} ausgewählt</span>
            <span className="text-green-600">
              {filteredArticles.filter(isAlreadyImported).length} bereits importiert
            </span>
          </div>

          {/* Article List */}
          <ScrollArea className="h-[400px] border rounded-lg">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Lade Artikel...
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Artikel gefunden</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredArticles.map(article => {
                  const alreadyImported = isAlreadyImported(article);
                  return (
                    <div
                      key={article.id}
                      className={`p-3 flex items-center gap-3 hover:bg-muted/50 ${
                        alreadyImported ? 'opacity-50' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.has(article.id)}
                        onCheckedChange={() => toggleArticle(article.id)}
                        disabled={alreadyImported}
                      />
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt={article.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{article.name}</p>
                          {alreadyImported && (
                            <Badge variant="secondary" className="text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Importiert
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          {article.sku && <span>SKU: {article.sku}</span>}
                          {article.category && (
                            <Badge variant="outline" className="text-xs">
                              {article.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">€{article.price.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">/ {article.unit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0 || importing}
          >
            {importing ? 'Importiere...' : `${selectedIds.size} Artikel importieren`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default B2BArticleImportDialog;
