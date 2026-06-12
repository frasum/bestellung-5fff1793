import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Package,
  MoreVertical,
  Pencil,
  Trash2,
  ShoppingCart,
  Upload,
} from 'lucide-react';
import { CsvImportDialog, ImportField } from '@/components/CsvImportDialog';
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
import B2BVendorArticleFormDialog from './B2BVendorArticleFormDialog';
import type { B2BVendor } from './B2BVendorsTab';

export interface B2BVendorArticle {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  sku: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  vendor_name?: string;
}

interface B2BVendorArticlesTabProps {
  accountId: string;
  supplierId?: string;
}

// Simple cart stored in localStorage - now with supplier isolation
const getCartStorageKey = (supplierId?: string) => 
  supplierId ? `b2b_purchase_cart_${supplierId}` : 'b2b_purchase_cart';

export const getPurchaseCart = (supplierId?: string): Record<string, number> => {
  const stored = localStorage.getItem(getCartStorageKey(supplierId));
  return stored ? JSON.parse(stored) : {};
};

export const setPurchaseCart = (cart: Record<string, number>, supplierId?: string) => {
  localStorage.setItem(getCartStorageKey(supplierId), JSON.stringify(cart));
  window.dispatchEvent(new Event('b2b-cart-update'));
};

const B2BVendorArticlesTab = ({ accountId, supplierId }: B2BVendorArticlesTabProps) => {
  const [articles, setArticles] = useState<B2BVendorArticle[]>([]);
  const [vendors, setVendors] = useState<B2BVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<B2BVendorArticle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<B2BVendorArticle | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const importFields: ImportField[] = [
    { name: 'name', label: 'Artikelname', required: true },
    { name: 'sku', label: 'Artikelnummer', required: false },
    { name: 'description', label: 'Beschreibung', required: false },
    { name: 'category', label: 'Kategorie', required: false },
    { name: 'price', label: 'Preis', required: false },
    { name: 'unit', label: 'Einheit', required: false },
  ];

  useEffect(() => {
    loadData();
    setCart(getPurchaseCart(supplierId));
    
    const handleCartUpdate = () => setCart(getPurchaseCart(supplierId));
    window.addEventListener('b2b-cart-update', handleCartUpdate);
    return () => window.removeEventListener('b2b-cart-update', handleCartUpdate);
  }, [accountId, supplierId]);

  const loadData = async () => {
    try {
      // Load vendors (filtered by supplier_id)
      let vendorsQuery = supabase
        .from('b2b_supplier_vendors')
        .select('*')
        .eq('supplier_account_id', accountId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (supplierId) {
        vendorsQuery = vendorsQuery.eq('supplier_id', supplierId);
      }

      const { data: vendorsData, error: vendorsError } = await vendorsQuery;

      if (vendorsError) throw vendorsError;
      setVendors((vendorsData || []).map(v => ({
        ...v,
        is_active: v.is_active ?? true,
        created_at: v.created_at ?? '',
      })));

      // Get vendor IDs for filtering articles
      const vendorIds = vendorsData?.map(v => v.id) || [];

      if (vendorIds.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      // Load articles (only for the filtered vendors)
      const { data: articlesData, error: articlesError } = await supabase
        .from('b2b_supplier_vendor_articles')
        .select('*')
        .eq('supplier_account_id', accountId)
        .in('vendor_id', vendorIds)
        .order('name', { ascending: true });

      if (articlesError) throw articlesError;

      // Map vendor names
      const vendorMap = new Map(vendorsData?.map(v => [v.id, v.name]) || []);
      const articlesWithVendor: B2BVendorArticle[] = (articlesData || []).map(a => ({
        id: a.id,
        vendor_id: a.vendor_id,
        name: a.name,
        description: a.description,
        price: a.price ?? 0,
        unit: a.unit ?? '',
        sku: a.sku,
        category: a.category,
        is_active: a.is_active ?? true,
        created_at: a.created_at ?? '',
        vendor_name: vendorMap.get(a.vendor_id) || 'Unbekannt',
      }));

      setArticles(articlesWithVendor);
    } catch (error: unknown) {
      console.error('Error loading data:', error instanceof Error ? error.message : error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const { error } = await supabase
        .from('b2b_supplier_vendor_articles')
        .delete()
        .eq('id', articleToDelete.id);

      if (error) throw error;

      toast.success('Artikel gelöscht');
      loadData();
    } catch (error: unknown) {
      console.error('Error deleting article:', error instanceof Error ? error.message : error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const addToCart = (articleId: string) => {
    const newCart = { ...cart };
    newCart[articleId] = (newCart[articleId] || 0) + 1;
    setPurchaseCart(newCart, supplierId);
    setCart(newCart);
    toast.success('Zum Warenkorb hinzugefügt');
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(search.toLowerCase()) ||
      article.sku?.toLowerCase().includes(search.toLowerCase()) ||
      article.category?.toLowerCase().includes(search.toLowerCase());
    const matchesVendor = selectedVendorId === 'all' || article.vendor_id === selectedVendorId;
    return matchesSearch && matchesVendor;
  });

  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))];

  const handleImportArticles = async (data: Record<string, string>[], defaultVendorId?: string) => {
    if (!defaultVendorId) {
      throw new Error('Bitte wählen Sie einen Lieferanten aus');
    }

    const articlesToInsert = data
      .filter(a => a.name?.trim())
      .map(a => ({
        supplier_account_id: accountId,
        vendor_id: defaultVendorId,
        name: a.name.trim(),
        description: a.description?.trim() || null,
        sku: a.sku?.trim() || null,
        category: a.category?.trim() || null,
        price: parseFloat(a.price?.replace(',', '.')) || 0,
        unit: a.unit?.trim() || 'Stk',
        is_active: true,
      }));

    if (articlesToInsert.length === 0) {
      throw new Error('Keine gültigen Artikel zum Importieren');
    }

    const { error } = await supabase
      .from('b2b_supplier_vendor_articles')
      .insert(articlesToInsert);

    if (error) throw error;
    
    toast.success(`${articlesToInsert.length} Artikel importiert`);
    loadData();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Artikel suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {vendors.length > 1 && (
            <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alle Lieferanten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Lieferanten</SelectItem>
                {vendors.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setImportDialogOpen(true)}
            disabled={vendors.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            variant="accent"
            onClick={() => { setEditingArticle(null); setDialogOpen(true); }}
            disabled={vendors.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Artikel hinzufügen
          </Button>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="border rounded-lg divide-y">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 animate-pulse flex items-center gap-4">
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="h-4 bg-muted rounded w-20" />
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Erst Lieferanten anlegen</h3>
            <p className="text-muted-foreground">
              Legen Sie zuerst einen Lieferanten an, bevor Sie Artikel hinzufügen können.
            </p>
          </CardContent>
        </Card>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Artikel gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Versuchen Sie einen anderen Suchbegriff' : 'Fügen Sie Ihren ersten Artikel hinzu'}
            </p>
            {!search && (
              <Button variant="accent" onClick={() => { setEditingArticle(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Artikel hinzufügen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredArticles.map(article => (
            <div 
              key={article.id} 
              className={`flex items-center justify-between p-3 hover:bg-muted/50 ${!article.is_active ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{article.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {article.sku && <span>SKU: {article.sku}</span>}
                      {article.category && (
                        <Badge variant="secondary" className="text-xs">{article.category}</Badge>
                      )}
                      {vendors.length > 1 && selectedVendorId === 'all' && (
                        <Badge variant="outline" className="text-xs">{article.vendor_name}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold whitespace-nowrap">
                      €{article.price.toFixed(2)} / {article.unit}
                    </span>
                    {cart[article.id] && (
                      <Badge variant="default" className="text-xs">
                        {cart[article.id]}×
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary"
                  onClick={() => addToCart(article.id)}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
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
            </div>
          ))}
        </div>
      )}

      {/* Article Form Dialog */}
      <B2BVendorArticleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
        accountId={accountId}
        vendors={vendors}
        categories={categories as string[]}
        onSuccess={loadData}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{articleToDelete?.name}" wirklich löschen?
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

      {/* Import Dialog */}
      <CsvImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        title="Artikel importieren"
        fields={importFields}
        onImport={handleImportArticles}
        templateFileName="artikel_vorlage.xlsx"
        enableAI={true}
        showSupplierSelect={true}
        suppliers={vendors.map(v => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
};

export default B2BVendorArticlesTab;