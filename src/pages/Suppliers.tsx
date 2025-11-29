import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { Plus, Pencil, Trash2, Search, Mail, Phone, MapPin, User, Loader2, Upload, Hash, Euro } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { CsvImportDialog, ImportField } from '@/components/CsvImportDialog';
import { useImportSuppliers } from '@/hooks/useImport';
import { ExportMenu } from '@/components/ExportMenu';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const supplierSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  customer_number: z.string().optional(),
  minimum_order_value: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

const SUPPLIER_IMPORT_FIELDS: ImportField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', required: true },
  { name: 'phone', label: 'Phone', required: false },
  { name: 'address', label: 'Address', required: false },
  { name: 'contact_person', label: 'Contact Person', required: false },
  { name: 'customer_number', label: 'Customer Number', required: false },
  { name: 'minimum_order_value', label: 'Minimum Order Value', required: false },
];

const Suppliers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  const { data: suppliers, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const importSuppliers = useImportSuppliers();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: '', email: '', phone: '', address: '', contact_person: '', customer_number: '', minimum_order_value: '' },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (editingSupplier) {
      form.reset({
        name: editingSupplier.name,
        email: editingSupplier.email,
        phone: editingSupplier.phone || '',
        address: editingSupplier.address || '',
        contact_person: editingSupplier.contact_person || '',
        customer_number: editingSupplier.customer_number || '',
        minimum_order_value: editingSupplier.minimum_order_value?.toString() || '',
      });
    } else {
      form.reset({ name: '', email: '', phone: '', address: '', contact_person: '', customer_number: '', minimum_order_value: '' });
    }
  }, [editingSupplier, form]);

  const handleSubmit = async (data: SupplierFormData) => {
    const input: SupplierInput = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      contact_person: data.contact_person || undefined,
      customer_number: data.customer_number || undefined,
      minimum_order_value: data.minimum_order_value ? parseFloat(data.minimum_order_value) : undefined,
    };

    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...input });
    } else {
      await createSupplier.mutateAsync(input);
    }
    setIsDialogOpen(false);
    setEditingSupplier(null);
    form.reset();
  };

  const handleDelete = async () => {
    if (deletingSupplier) {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      setDeletingSupplier(null);
    }
  };

  const filteredSuppliers = suppliers?.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Suppliers</h1>
            <p className="text-muted-foreground mt-1">Manage your suppliers and their contact information</p>
          </div>
          <div className="flex gap-2">
            <ExportMenu
              filename="suppliers"
              title="Suppliers"
              headers={['Name', 'Email', 'Phone', 'Address', 'Contact Person', 'Customer Number', 'Status']}
              getData={() => suppliers?.map(s => [
                s.name,
                s.email,
                s.phone || '',
                s.address || '',
                s.contact_person || '',
                s.customer_number || '',
                s.is_active ? 'Active' : 'Inactive'
              ]) || []}
              disabled={!suppliers?.length}
            />
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) setEditingSupplier(null);
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input id="name" {...form.register('name')} placeholder="Fresh Farms Italia" />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...form.register('email')} placeholder="orders@supplier.com" />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...form.register('phone')} placeholder="+39 02 1234567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...form.register('address')} placeholder="Via Roma 123, Milano" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input id="contact_person" {...form.register('contact_person')} placeholder="Marco Rossi" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_number">Customer Number</Label>
                  <Input id="customer_number" {...form.register('customer_number')} placeholder="KD-12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_order_value">Minimum Order Value (€)</Label>
                  <Input 
                    id="minimum_order_value" 
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register('minimum_order_value')} 
                    placeholder="50.00" 
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => {
                    setIsDialogOpen(false);
                    setEditingSupplier(null);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createSupplier.isPending || updateSupplier.isPending}
                  >
                    {(createSupplier.isPending || updateSupplier.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingSupplier ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <CsvImportDialog
          open={isImportOpen}
          onOpenChange={setIsImportOpen}
          title="Import Suppliers"
          fields={SUPPLIER_IMPORT_FIELDS}
          onImport={async (data) => {
            await importSuppliers.mutateAsync(data);
          }}
          templateFileName="suppliers_template.csv"
        />

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Suppliers Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredSuppliers?.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">
              {searchQuery ? 'No suppliers found matching your search' : 'No suppliers yet. Add your first supplier to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers?.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{supplier.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      supplier.is_active 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingSupplier(supplier)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{supplier.address}</span>
                    </div>
                  )}
                  {supplier.contact_person && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>{supplier.contact_person}</span>
                    </div>
                  )}
                  {supplier.customer_number && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Hash className="w-4 h-4" />
                      <span>Kd-Nr: {supplier.customer_number}</span>
                    </div>
                  )}
                  {supplier.minimum_order_value && supplier.minimum_order_value > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Euro className="w-4 h-4" />
                      <span>Min: €{Number(supplier.minimum_order_value).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={() => setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingSupplier?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Suppliers;
