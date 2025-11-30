import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, useDeactivateSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useArticles, Article } from '@/hooks/useArticles';
import { Plus, Pencil, Trash2, Search, Mail, Phone, MapPin, User, Loader2, Upload, Hash, Euro, Filter, RotateCcw, Power, LayoutGrid, List, ChevronDown, ChevronRight, Minus, ShoppingCart, FileText } from 'lucide-react';
import { generateOrderListPdf } from '@/lib/orderListPdf';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm } from 'react-hook-form';
import { CsvImportDialog, ImportField } from '@/components/CsvImportDialog';
import { useImportSuppliers, useImportArticles } from '@/hooks/useImport';
import { ExportMenu } from '@/components/ExportMenu';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
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

const ARTICLE_IMPORT_FIELDS: ImportField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'price', label: 'Price', required: true },
  { name: 'unit', label: 'Unit', required: false },
  { name: 'sku', label: 'SKU', required: false },
  { name: 'category', label: 'Category', required: false },
  { name: 'description', label: 'Description', required: false },
];

const Suppliers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { addItem, updateQuantity, items: cartItems, getItemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [articleImportSupplierId, setArticleImportSupplierId] = useState<string | null>(null);

  const { data: suppliers, isLoading } = useSuppliers();
  const { data: allArticles } = useArticles();
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const deactivateSupplier = useDeactivateSupplier();
  const importSuppliers = useImportSuppliers();
  const importArticles = useImportArticles();
  const [showDeactivateOption, setShowDeactivateOption] = useState(false);

  // Group articles by supplier
  const articlesBySupplier = allArticles?.reduce((acc, article) => {
    if (!acc[article.supplier_id]) {
      acc[article.supplier_id] = [];
    }
    acc[article.supplier_id].push(article);
    return acc;
  }, {} as Record<string, Article[]>) || {};

  const toggleSupplierExpanded = (supplierId: string) => {
    setExpandedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const getCartQuantity = (articleId: string) => {
    const item = cartItems.find((i) => i.article.id === articleId);
    return item?.quantity || 0;
  };

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
      try {
        await deleteSupplier.mutateAsync(deletingSupplier.id);
        setDeletingSupplier(null);
        setShowDeactivateOption(false);
      } catch (error: any) {
        if (error.message === 'FOREIGN_KEY_CONSTRAINT') {
          setShowDeactivateOption(true);
        }
      }
    }
  };

  const handleDeactivate = async () => {
    if (deletingSupplier) {
      await deactivateSupplier.mutateAsync(deletingSupplier.id);
      setDeletingSupplier(null);
      setShowDeactivateOption(false);
    }
  };

  const filteredSuppliers = suppliers?.filter((supplier) => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && supplier.is_active) ||
      (statusFilter === 'inactive' && !supplier.is_active);
    return matchesSearch && matchesStatus;
  });

  const handleReactivate = async (supplier: Supplier) => {
    await updateSupplier.mutateAsync({ id: supplier.id, is_active: true });
  };

  const handleDeactivateQuick = async (supplier: Supplier) => {
    await deactivateSupplier.mutateAsync(supplier.id);
  };

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
                
                {/* Article Import Button - only show when editing */}
                {editingSupplier && (
                  <div className="pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setArticleImportSupplierId(editingSupplier.id);
                        setIsDialogOpen(false);
                      }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Artikel für {editingSupplier.name} importieren
                    </Button>
                  </div>
                )}
                
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

        {/* Article Import Dialog for specific supplier */}
        <CsvImportDialog
          open={!!articleImportSupplierId}
          onOpenChange={(open) => !open && setArticleImportSupplierId(null)}
          title={`Artikel importieren für ${suppliers?.find(s => s.id === articleImportSupplierId)?.name || 'Lieferant'}`}
          fields={ARTICLE_IMPORT_FIELDS}
          onImport={async (data) => {
            if (articleImportSupplierId) {
              await importArticles.mutateAsync({ articles: data, defaultSupplierId: articleImportSupplierId });
            }
          }}
          templateFileName="articles_template.csv"
        />

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Lieferanten suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border z-50">
              <SelectItem value="all">Alle Lieferanten</SelectItem>
              <SelectItem value="active">Nur Aktive</SelectItem>
              <SelectItem value="inactive">Nur Inaktive</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none h-10 w-10"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-none h-10 w-10"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => navigate('/cart')} className="relative">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Warenkorb
            {getItemCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {getItemCount()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Suppliers */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredSuppliers?.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' 
                ? 'Keine Lieferanten gefunden' 
                : 'Noch keine Lieferanten. Fügen Sie Ihren ersten Lieferanten hinzu.'}
            </p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View with expandable articles */
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Lieferant</TableHead>
                  <TableHead className="hidden md:table-cell">Kontakt</TableHead>
                  <TableHead className="hidden lg:table-cell">Artikel</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers?.map((supplier) => {
                  const supplierArticles = articlesBySupplier[supplier.id] || [];
                  const isExpanded = expandedSuppliers.has(supplier.id);
                  return (
                    <>
                      <TableRow key={supplier.id} className={`group ${!supplier.is_active ? 'opacity-60' : ''}`}>
                        <TableCell className="py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => toggleSupplierExpanded(supplier.id)}
                            disabled={supplierArticles.length === 0}
                          >
                            {supplierArticles.length > 0 ? (
                              isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                            ) : (
                              <span className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-foreground">{supplier.name}</p>
                              <p className="text-xs text-muted-foreground">{supplier.email}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              supplier.is_active 
                                ? 'bg-success/20 text-success' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {supplier.is_active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground py-2">
                          <div className="text-sm">
                            {supplier.phone && <p>{supplier.phone}</p>}
                            {supplier.contact_person && <p>{supplier.contact_person}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell py-2">
                          <Badge variant="secondary">{supplierArticles.length} Artikel</Badge>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-1">
                            {supplierArticles.length > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                onClick={() => generateOrderListPdf(supplier, supplierArticles)}
                                title="Bestellliste drucken"
                              >
                                <FileText className="w-3 h-3" />
                              </Button>
                            )}
                            {!supplier.is_active ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-success hover:text-success"
                                onClick={() => handleReactivate(supplier)}
                                title="Reaktivieren"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-orange-500"
                                onClick={() => handleDeactivateQuick(supplier)}
                                title="Deaktivieren"
                              >
                                <Power className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingSupplier(supplier);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeletingSupplier(supplier)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {/* Expanded articles section */}
                      {isExpanded && supplierArticles.length > 0 && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={5} className="p-0">
                            <div className="p-4 pl-12">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent border-b border-border/50">
                                    <TableHead className="h-8 text-xs">Artikel</TableHead>
                                    <TableHead className="h-8 text-xs hidden md:table-cell">Beschreibung</TableHead>
                                    <TableHead className="h-8 text-xs text-right">Preis</TableHead>
                                    <TableHead className="h-8 text-xs text-center w-[120px]">Menge</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {supplierArticles.map((article) => {
                                    const cartQty = getCartQuantity(article.id);
                                    return (
                                      <TableRow key={article.id} className={`border-b border-border/30 hover:bg-muted/50 ${cartQty > 0 ? 'bg-destructive/10 text-destructive' : ''}`}>
                                        <TableCell className="py-1.5">
                                          <p className="text-sm font-medium">{article.name}</p>
                                        </TableCell>
                                        <TableCell className="py-1.5 hidden md:table-cell">
                                          <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={article.description || ''}>
                                            {article.description || '-'}
                                          </p>
                                        </TableCell>
                                        <TableCell className="py-1.5 text-right text-sm">
                                          €{Number(article.price).toFixed(2)}
                                          <span className="text-xs text-muted-foreground ml-1">/{article.unit}</span>
                                        </TableCell>
                                        <TableCell className="py-1.5">
                                          <div className="flex items-center justify-center gap-1">
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              className="h-7 w-7"
                                              onClick={() => updateQuantity(article.id, cartQty - 1)}
                                              disabled={cartQty === 0}
                                            >
                                              <Minus className="w-3 h-3" />
                                            </Button>
                                            <span className={`w-6 text-center text-sm font-medium ${cartQty > 0 ? 'text-destructive' : ''}`}>{cartQty}</span>
                                            <Button
                                              size="icon"
                                              variant="outline"
                                              className="h-7 w-7"
                                              onClick={() => addItem(article, 1)}
                                            >
                                              <Plus className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Grid View */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers?.map((supplier) => (
              <div
                key={supplier.id}
                className={`bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors ${!supplier.is_active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{supplier.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      supplier.is_active 
                        ? 'bg-success/20 text-success' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {supplier.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(articlesBySupplier[supplier.id]?.length || 0) > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => generateOrderListPdf(supplier, articlesBySupplier[supplier.id] || [])}
                        title="Bestellliste drucken"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    )}
                    {!supplier.is_active ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-success hover:text-success"
                        onClick={() => handleReactivate(supplier)}
                        title="Reaktivieren"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-orange-500"
                        onClick={() => handleDeactivateQuick(supplier)}
                        title="Deaktivieren"
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    )}
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
                <div className="mt-4 pt-4 border-t border-border">
                  <Badge variant="secondary">{articlesBySupplier[supplier.id]?.length || 0} Artikel</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={() => {
        setDeletingSupplier(null);
        setShowDeactivateOption(false);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showDeactivateOption ? 'Lieferant deaktivieren?' : 'Lieferant löschen'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showDeactivateOption 
                ? `"${deletingSupplier?.name}" kann nicht gelöscht werden, da noch Bestellungen existieren. Möchten Sie den Lieferanten stattdessen deaktivieren?`
                : `Sind Sie sicher, dass Sie "${deletingSupplier?.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            {showDeactivateOption ? (
              <AlertDialogAction
                onClick={handleDeactivate}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                {deactivateSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deaktivieren'}
              </AlertDialogAction>
            ) : (
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Löschen'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Suppliers;
