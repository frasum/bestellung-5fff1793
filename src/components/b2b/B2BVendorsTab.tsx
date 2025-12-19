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
  Factory,
  Mail,
  Phone,
  MapPin,
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
import B2BVendorFormDialog from './B2BVendorFormDialog';

export interface B2BVendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  supplier_id?: string | null;
}

interface B2BVendorsTabProps {
  accountId: string;
  supplierId?: string;
  onVendorChange?: () => void;
}

const B2BVendorsTab = ({ accountId, supplierId, onVendorChange }: B2BVendorsTabProps) => {
  const [vendors, setVendors] = useState<B2BVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<B2BVendor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<B2BVendor | null>(null);

  useEffect(() => {
    loadVendors();
  }, [accountId, supplierId]);

  const loadVendors = async () => {
    try {
      let query = supabase
        .from('b2b_supplier_vendors')
        .select('*')
        .eq('supplier_account_id', accountId)
        .order('name', { ascending: true });

      // Filter by supplier_id if provided
      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error loading vendors:', error);
      toast.error('Fehler beim Laden der Lieferanten');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!vendorToDelete) return;

    try {
      const { error } = await supabase
        .from('b2b_supplier_vendors')
        .delete()
        .eq('id', vendorToDelete.id);

      if (error) throw error;

      toast.success('Lieferant gelöscht');
      loadVendors();
      onVendorChange?.();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(search.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(search.toLowerCase())
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
        <Button onClick={() => { setEditingVendor(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Lieferant hinzufügen
        </Button>
      </div>

      {/* Vendors List */}
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
      ) : filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Factory className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Lieferanten gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {search 
                ? 'Versuchen Sie einen anderen Suchbegriff' 
                : 'Fügen Sie Ihren ersten Lieferanten hinzu'}
            </p>
            {!search && (
              <Button onClick={() => { setEditingVendor(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Lieferanten hinzufügen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredVendors.map(vendor => (
            <Card key={vendor.id} className={!vendor.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Factory className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{vendor.name}</h4>
                        {!vendor.is_active && (
                          <Badge variant="outline" className="text-xs">
                            Inaktiv
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        {vendor.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {vendor.email}
                          </span>
                        )}
                        {vendor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {vendor.phone}
                          </span>
                        )}
                      </div>
                      {vendor.address && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {vendor.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingVendor(vendor); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => { setVendorToDelete(vendor); setDeleteDialogOpen(true); }}
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

      {/* Vendor Form Dialog */}
      <B2BVendorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendor={editingVendor}
        accountId={accountId}
        supplierId={supplierId}
        onSuccess={() => {
          loadVendors();
          onVendorChange?.();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{vendorToDelete?.name}" wirklich löschen? 
              Alle zugehörigen Artikel und Bestellungen werden ebenfalls gelöscht.
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

export default B2BVendorsTab;