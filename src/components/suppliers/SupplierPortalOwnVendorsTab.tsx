import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Search, Pencil, Trash2, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';

interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
}

interface OwnVendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

interface Props {
  session: SupplierSession;
}

export const SupplierPortalOwnVendorsTab = ({ session }: Props) => {
  const [vendors, setVendors] = useState<OwnVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<OwnVendor | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'list-own-vendors',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
        },
      });

      if (error) throw error;
      setVendors(data?.vendors || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast.error('Fehler beim Laden der Lieferanten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [session]);

  const handleOpenDialog = (vendor?: OwnVendor) => {
    if (vendor) {
      setSelectedVendor(vendor);
      setFormData({
        name: vendor.name,
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || '',
        notes: vendor.notes || '',
      });
    } else {
      setSelectedVendor(null);
      setFormData({ name: '', email: '', phone: '', address: '', notes: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    setSaving(true);
    try {
      const action = selectedVendor ? 'update-own-vendor' : 'create-own-vendor';
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action,
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          vendorId: selectedVendor?.id,
          vendorData: {
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            address: formData.address.trim() || null,
            notes: formData.notes.trim() || null,
          },
        },
      });

      if (error) throw error;
      
      toast.success(selectedVendor ? 'Lieferant aktualisiert' : 'Lieferant angelegt');
      setDialogOpen(false);
      fetchVendors();
    } catch (error: any) {
      console.error('Error saving vendor:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedVendor) return;

    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'delete-own-vendor',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          vendorId: selectedVendor.id,
        },
      });

      if (error) throw error;
      
      toast.success('Lieferant gelöscht');
      setDeleteDialogOpen(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Meine Lieferanten
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihre eigenen Lieferanten (Weingüter, Großhändler, etc.)
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Neu
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredVendors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Lieferanten gefunden</p>
            <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Lieferanten anlegen
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.email || '-'}</TableCell>
                      <TableCell>{vendor.phone || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{vendor.address || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(vendor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setSelectedVendor(vendor); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{vendor.name}</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(vendor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSelectedVendor(vendor); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {vendor.email}
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {vendor.phone}
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {vendor.address}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedVendor ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Weingut Müller"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="bestellung@weingut.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Straße, PLZ, Ort"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Interne Anmerkungen..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{selectedVendor?.name}" wirklich löschen? Alle zugehörigen Artikel werden ebenfalls gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
