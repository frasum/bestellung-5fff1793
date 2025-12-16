import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Users,
  Mail,
  Phone,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  Send,
  ShoppingCart,
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
import B2BCustomerFormDialog from './B2BCustomerFormDialog';

interface B2BSupplier {
  id: string;
  name: string;
}

interface B2BCustomer {
  id: string;
  company_name: string;
  email: string;
  customer_number: string | null;
  contact_person: string | null;
  phone: string | null;
  delivery_address: string | null;
  is_active: boolean;
  user_id: string | null;
  created_at: string;
  supplier_id: string | null;
  has_purchase_feature: boolean;
}

interface B2BCustomersTabProps {
  accountId: string;
  supplierName: string;
  onStatsChange: () => void;
  selectedSupplierId: string | null;
  suppliers: B2BSupplier[];
}

const B2BCustomersTab = ({ 
  accountId, 
  supplierName, 
  onStatsChange,
  selectedSupplierId,
  suppliers,
}: B2BCustomersTabProps) => {
  const [customers, setCustomers] = useState<B2BCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<B2BCustomer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<B2BCustomer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, [accountId, selectedSupplierId]);

  const loadCustomers = async () => {
    try {
      let query = supabase
        .from('supplier_b2b_customers')
        .select('*')
        .eq('supplier_account_id', accountId)
        .order('company_name', { ascending: true });

      // Filter by selected supplier if one is selected
      if (selectedSupplierId) {
        query = query.eq('supplier_id', selectedSupplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast.error('Fehler beim Laden der Kunden');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from('supplier_b2b_customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      toast.success('Kunde gelöscht');
      loadCustomers();
      onStatsChange();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleResendInvitation = async (customer: B2BCustomer) => {
    try {
      toast.info('Einladung wird gesendet...');
      
      const { data: existingInvitation, error: fetchError } = await supabase
        .from('b2b_customer_invitations')
        .select('token')
        .eq('supplier_account_id', accountId)
        .eq('email', customer.email)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      let inviteToken: string;

      if (existingInvitation) {
        inviteToken = existingInvitation.token;
      } else {
        const { data: newInvitation, error: createError } = await supabase
          .from('b2b_customer_invitations')
          .insert({
            supplier_account_id: accountId,
            email: customer.email,
          })
          .select()
          .single();

        if (createError) throw createError;
        inviteToken = newInvitation.token;
      }

      // Get supplier name for the email
      const supplier = suppliers.find(s => s.id === customer.supplier_id);
      const supplierNameForEmail = supplier?.name || supplierName;

      const { error: emailError } = await supabase.functions.invoke('send-b2b-customer-invitation', {
        body: {
          email: customer.email,
          companyName: customer.company_name,
          supplierName: supplierNameForEmail,
          inviteToken,
          supplierAccountId: accountId,
        },
      });

      if (emailError) throw emailError;

      toast.success('Einladung erneut gesendet');
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error('Fehler beim Senden der Einladung');
    }
  };

  const handleTogglePurchaseFeature = async (customer: B2BCustomer, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('supplier_b2b_customers')
        .update({ has_purchase_feature: enabled })
        .eq('id', customer.id);

      if (error) throw error;

      toast.success(enabled ? '"Mein Einkauf" aktiviert' : '"Mein Einkauf" deaktiviert');
      loadCustomers();
    } catch (error: any) {
      console.error('Error toggling purchase feature:', error);
      toast.error('Fehler beim Ändern der Einstellung');
    }
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return null;
    return suppliers.find(s => s.id === supplierId)?.name;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.company_name.toLowerCase().includes(search.toLowerCase()) ||
    customer.email.toLowerCase().includes(search.toLowerCase()) ||
    customer.customer_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kunden suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => { setEditingCustomer(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Kunden einladen
        </Button>
      </div>

      {/* Customers List */}
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
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Keine Kunden gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {search 
                ? 'Versuchen Sie einen anderen Suchbegriff' 
                : selectedSupplierId 
                  ? 'Keine Kunden für diesen Lieferanten'
                  : 'Laden Sie Ihren ersten Kunden ein'}
            </p>
            {!search && (
              <Button onClick={() => { setEditingCustomer(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Kunden einladen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map(customer => (
            <Card key={customer.id} className={!customer.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{customer.company_name}</h4>
                        {customer.customer_number && (
                          <Badge variant="outline" className="text-xs">
                            #{customer.customer_number}
                          </Badge>
                        )}
                        {customer.user_id ? (
                          <Badge variant="secondary" className="text-xs">
                            Registriert
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-orange-500 border-orange-500">
                            Einladung ausstehend
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.phone}
                          </span>
                        )}
                      </div>
                      {customer.contact_person && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Ansprechpartner: {customer.contact_person}
                        </p>
                      )}
                      {/* Supplier Badge - only show if not filtered and multiple suppliers exist */}
                      {!selectedSupplierId && suppliers.length > 1 && customer.supplier_id && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getSupplierName(customer.supplier_id)}
                          </Badge>
                        </div>
                      )}
                      {/* Mein Einkauf Toggle - only for registered customers */}
                      {customer.user_id && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground flex-1">Mein Einkauf</span>
                          <Switch
                            checked={customer.has_purchase_feature}
                            onCheckedChange={(checked) => handleTogglePurchaseFeature(customer, checked)}
                          />
                        </div>
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
                      <DropdownMenuItem onClick={() => { setEditingCustomer(customer); setDialogOpen(true); }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      {!customer.user_id && (
                        <DropdownMenuItem onClick={() => handleResendInvitation(customer)}>
                          <Send className="h-4 w-4 mr-2" />
                          Einladung erneut senden
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => { setCustomerToDelete(customer); setDeleteDialogOpen(true); }}
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

      {/* Customer Form Dialog */}
      <B2BCustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
        accountId={accountId}
        supplierName={supplierName}
        suppliers={suppliers}
        selectedSupplierId={selectedSupplierId}
        onSuccess={() => {
          loadCustomers();
          onStatsChange();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kunden löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{customerToDelete?.company_name}" wirklich löschen? 
              Alle zugehörigen Bestellungen und individuellen Preise werden ebenfalls gelöscht.
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

export default B2BCustomersTab;