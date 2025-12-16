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
  Pencil,
  Trash2,
  Truck,
  MoreVertical,
  Mail,
  Phone,
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
import B2BSupplierFormDialog from './B2BSupplierFormDialog';

export interface B2BSupplier {
  id: string;
  account_id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  article_count?: number;
}

interface B2BSuppliersTabProps {
  accountId: string;
  onStatsChange?: () => void;
}

const B2BSuppliersTab = ({ accountId, onStatsChange }: B2BSuppliersTabProps) => {
  const [suppliers, setSuppliers] = useState<B2BSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<B2BSupplier | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<B2BSupplier | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, [accountId]);

  const loadSuppliers = async () => {
    try {
      // Get suppliers with article count
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('b2b_suppliers')
        .select('*')
        .eq('account_id', accountId)
        .order('sort_order', { ascending: true });

      if (suppliersError) throw suppliersError;

      // Get article counts per supplier
      const { data: articleCounts, error: countError } = await supabase
        .from('supplier_b2b_articles')
        .select('supplier_id')
        .eq('supplier_account_id', accountId);

      if (countError) throw countError;

      // Calculate counts
      const counts: Record<string, number> = {};
      articleCounts?.forEach(a => {
        if (a.supplier_id) {
          counts[a.supplier_id] = (counts[a.supplier_id] || 0) + 1;
        }
      });

      const suppliersWithCounts = (suppliersData || []).map(s => ({
        ...s,
        article_count: counts[s.id] || 0,
      }));

      setSuppliers(suppliersWithCounts);
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      toast.error('Fehler beim Laden der Lieferanten');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplierToDelete) return;

    try {
      // Check if supplier has articles
      if (supplierToDelete.article_count && supplierToDelete.article_count > 0) {
        toast.error('Lieferant hat noch Artikel. Bitte erst alle Artikel entfernen oder einem anderen Lieferanten zuweisen.');
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('b2b_suppliers')
        .delete()
        .eq('id', supplierToDelete.id);

      if (error) throw error;

      toast.success('Lieferant gelöscht');
      loadSuppliers();
      onStatsChange?.();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(search.toLowerCase()) ||
    supplier.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Lieferanten suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { setEditingSupplier(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Lieferant hinzufügen
        </Button>
      </div>

      {/* Suppliers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Lieferanten gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Versuchen Sie einen anderen Suchbegriff' : 'Fügen Sie Ihren ersten Lieferanten hinzu'}
            </p>
            {!search && (
              <Button onClick={() => { setEditingSupplier(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Lieferanten hinzufügen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(supplier => (
            <Card key={supplier.id} className={!supplier.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {supplier.logo_url ? (
                    <img
                      src={supplier.logo_url}
                      alt={supplier.name}
                      className="h-16 w-16 object-contain rounded-lg bg-muted"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center">
                      <Truck className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium truncate">{supplier.name}</h4>
                        <Badge variant="secondary" className="mt-1">
                          {supplier.article_count || 0} Artikel
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingSupplier(supplier); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => { setSupplierToDelete(supplier); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {(supplier.contact_email || supplier.contact_phone) && (
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {supplier.contact_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{supplier.contact_email}</span>
                          </div>
                        )}
                        {supplier.contact_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.contact_phone}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {supplier.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                    {supplier.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Supplier Form Dialog */}
      <B2BSupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={editingSupplier}
        accountId={accountId}
        onSuccess={() => {
          loadSuppliers();
          onStatsChange?.();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{supplierToDelete?.name}" wirklich löschen? 
              {supplierToDelete?.article_count ? (
                <span className="block mt-2 text-destructive">
                  Dieser Lieferant hat noch {supplierToDelete.article_count} Artikel zugewiesen.
                </span>
              ) : (
                ' Diese Aktion kann nicht rückgängig gemacht werden.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground"
              disabled={!!supplierToDelete?.article_count}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default B2BSuppliersTab;
