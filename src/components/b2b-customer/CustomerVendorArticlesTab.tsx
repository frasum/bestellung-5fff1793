import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Package,
  MoreVertical,
  Pencil,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CustomerVendorArticleFormDialog from './CustomerVendorArticleFormDialog';

interface CustomerVendor {
  id: string;
  name: string;
}

export interface CustomerVendorArticle {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  price: number;
  unit: string;
  is_active: boolean;
  created_at: string;
}

interface CustomerVendorArticlesTabProps {
  customerId: string;
}

const CustomerVendorArticlesTab = ({ customerId }: CustomerVendorArticlesTabProps) => {
  const [articles, setArticles] = useState<CustomerVendorArticle[]>([]);
  const [vendors, setVendors] = useState<CustomerVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<CustomerVendorArticle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<CustomerVendorArticle | null>(null);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      // Load vendors
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('b2b_customer_vendors')
        .select('id, name')
        .eq('customer_id', customerId)
        .order('name');

      if (vendorsError) throw vendorsError;
      setVendors(vendorsData || []);

      // Load articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('b2b_customer_vendor_articles')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');

      if (articlesError) throw articlesError;
      setArticles(articlesData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const { error } = await supabase
        .from('b2b_customer_vendor_articles')
        .delete()
        .eq('id', articleToDelete.id);

      if (error) throw error;

      toast.success('Artikel gelöscht');
      loadData();
    } catch (error: any) {
      console.error('Error deleting article:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || 'Unbekannt';
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(search.toLowerCase()) ||
      article.sku?.toLowerCase().includes(search.toLowerCase()) ||
      article.category?.toLowerCase().includes(search.toLowerCase());
    const matchesVendor = selectedVendor === 'all' || article.vendor_id === selectedVendor;
    return matchesSearch && matchesVendor;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Artikel suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Alle Lieferanten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Lieferanten</SelectItem>
              {vendors.map(vendor => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditingArticle(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Artikel hinzufügen
        </Button>
      </div>

      {/* Articles List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Lieferanten vorhanden</h3>
            <p className="text-muted-foreground mb-4">
              Fügen Sie zuerst einen Lieferanten hinzu, um Artikel anzulegen.
            </p>
          </CardContent>
        </Card>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Artikel gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {search 
                ? 'Versuchen Sie einen anderen Suchbegriff' 
                : 'Fügen Sie Ihren ersten Artikel hinzu'}
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
        <div className="space-y-3">
          {filteredArticles.map(article => (
            <Card key={article.id} className={!article.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{article.name}</h4>
                        {article.sku && (
                          <Badge variant="outline" className="text-xs">
                            {article.sku}
                          </Badge>
                        )}
                        {!article.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inaktiv
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span>{getVendorName(article.vendor_id)}</span>
                        {article.category && <span>• {article.category}</span>}
                      </div>
                      <div className="mt-2">
                        <span className="font-semibold">€{article.price.toFixed(2)}</span>
                        <span className="text-muted-foreground text-sm ml-1">/ {article.unit}</span>
                      </div>
                    </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Article Form Dialog */}
      <CustomerVendorArticleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        article={editingArticle}
        customerId={customerId}
        vendors={vendors}
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
    </div>
  );
};

export default CustomerVendorArticlesTab;
