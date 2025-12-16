import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  MoreVertical,
  Download,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import B2BArticleFormDialog from './B2BArticleFormDialog';
import B2BArticleImportDialog from './B2BArticleImportDialog';

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
  supplier_id: string | null;
  supplier_name?: string;
}

interface B2BSupplier {
  id: string;
  name: string;
}

interface B2BArticlesTabProps {
  accountId: string;
  linkedSupplierId: string | null;
  selectedSupplierId?: string;
  suppliers?: B2BSupplier[];
  onStatsChange: () => void;
}

const B2BArticlesTab = ({ accountId, linkedSupplierId, selectedSupplierId = 'all', suppliers: externalSuppliers, onStatsChange }: B2BArticlesTabProps) => {
  const [articles, setArticles] = useState<B2BArticle[]>([]);
  const [suppliers, setSuppliers] = useState<B2BSupplier[]>(externalSuppliers || []);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<B2BArticle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<B2BArticle | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [accountId, selectedSupplierId]);

  useEffect(() => {
    if (externalSuppliers) {
      setSuppliers(externalSuppliers);
    }
  }, [externalSuppliers]);

  const loadData = async () => {
    try {
      // Load suppliers if not provided externally
      if (!externalSuppliers) {
        const { data: suppliersData, error: suppliersError } = await supabase
          .from('b2b_suppliers')
          .select('id, name')
          .eq('account_id', accountId)
          .order('sort_order', { ascending: true });

        if (suppliersError) throw suppliersError;
        setSuppliers(suppliersData || []);
      }

      // Load articles with optional supplier filter
      let query = supabase
        .from('supplier_b2b_articles')
        .select('*')
        .eq('supplier_account_id', accountId)
        .order('sort_order', { ascending: true });

      if (selectedSupplierId && selectedSupplierId !== 'all') {
        query = query.eq('supplier_id', selectedSupplierId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map supplier names to articles
      const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
      const articlesWithSupplier = (data || []).map(a => ({
        ...a,
        supplier_name: a.supplier_id ? supplierMap.get(a.supplier_id) : undefined,
      }));

      setArticles(articlesWithSupplier);
    } catch (error: any) {
      console.error('Error loading articles:', error);
      toast.error('Fehler beim Laden der Artikel');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const { error } = await supabase
        .from('supplier_b2b_articles')
        .delete()
        .eq('id', articleToDelete.id);

      if (error) throw error;

      toast.success('Artikel gelöscht');
      loadData();
      onStatsChange();
    } catch (error: any) {
      console.error('Error deleting article:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(search.toLowerCase()) ||
      article.sku?.toLowerCase().includes(search.toLowerCase()) ||
      article.category?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Von Bestellung.pro importieren
          </Button>
          <Button onClick={() => { setEditingArticle(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Artikel hinzufügen
          </Button>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Artikel gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Versuchen Sie einen anderen Suchbegriff' : 'Fügen Sie Ihren ersten Artikel hinzu'}
            </p>
            {!search && (
              <Button onClick={() => { setEditingArticle(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Artikel hinzufügen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map(article => (
            <Card key={article.id} className={!article.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.name}
                      className="h-20 w-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-20 w-20 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium truncate">{article.name}</h4>
                        {article.sku && (
                          <p className="text-sm text-muted-foreground">SKU: {article.sku}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingArticle(article); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => { setArticleToDelete(article); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-semibold">
                        €{article.base_price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">/ {article.unit}</span>
                    </div>
                    {article.category && (
                      <Badge variant="secondary" className="mt-2">
                        {article.category}
                      </Badge>
                    )}
                    {article.supplier_name && suppliers.length > 1 && selectedSupplierId === 'all' && (
                      <Badge variant="outline" className="mt-2 ml-1">
                        {article.supplier_name}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Article Form Dialog */}
      <B2BArticleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
        accountId={accountId}
        categories={categories as string[]}
        suppliers={suppliers}
        onSuccess={() => {
          loadData();
          onStatsChange();
        }}
      />

      {/* Import Dialog */}
      <B2BArticleImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        accountId={accountId}
        linkedSupplierId={linkedSupplierId}
        suppliers={suppliers}
        onSuccess={() => {
          loadData();
          onStatsChange();
        }}
      />
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{articleToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default B2BArticlesTab;
