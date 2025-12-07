import { Fragment, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useArticles, useCreateArticle, useUpdateArticle, useDeleteArticle, useBulkUpdateArticles, Article, ArticleInput } from '@/hooks/useArticles';
import { Plus, Pencil, Trash2, Search, Loader2, Upload, ChevronDown, ChevronRight, Minus, FileText, Printer, Send, Bell, Store, ShoppingCart, LayoutGrid, List, X, Tags, Package } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SupplierLocationsDialog } from '@/components/suppliers/SupplierLocationsDialog';
import { useSendSupplierInvitation } from '@/hooks/useSupplierPortal';
import { generateOrderListPdf, generateCombinedOrderListPdf } from '@/lib/orderListPdf';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useForm, Controller } from 'react-hook-form';
import { CsvImportDialog, ImportField } from '@/components/CsvImportDialog';
import { useImportSuppliers, useImportArticles } from '@/hooks/useImport';
import { supabase } from '@/integrations/supabase/client';
import { ExportMenu } from '@/components/ExportMenu';
import { Badge } from '@/components/ui/badge';
import { useSupplierPendingChanges } from '@/hooks/useSupplierChanges';
import { SupplierChangesDialog } from '@/components/suppliers/SupplierChangesDialog';
import { PriceHistoryPopover } from '@/components/suppliers/PriceHistoryPopover';
import { CategoryFilterDropdown } from '@/components/CategoryFilterDropdown';
import { useCategories } from '@/hooks/useCategories';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const supplierSchema = z.object({
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  phone: z.string().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  customer_number: z.string().optional(),
  minimum_order_value: z.string().optional(),
  top_category: z.string().optional(),
  main_category: z.string().optional()
});

const articleSchema = z.object({
  supplier_id: z.string().min(1, 'Bitte wählen Sie einen Lieferanten'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen haben'),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().min(1, 'Einheit ist erforderlich'),
  price: z.string().min(1, 'Preis ist erforderlich').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Preis muss eine positive Zahl sein'),
  category: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;
type ArticleFormData = z.infer<typeof articleSchema>;

const TOP_CATEGORIES = ['Küche', 'Getränke', 'Bedarfsartikel'] as const;
const DEFAULT_UNITS = ['kg', 'g', 'L', 'ml', 'Stk', 'Karton', 'Bund', 'Packung'];

const SUPPLIER_IMPORT_FIELDS: ImportField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'email', label: 'Email', required: true },
  { name: 'phone', label: 'Phone', required: false },
  { name: 'address', label: 'Address', required: false },
  { name: 'contact_person', label: 'Contact Person', required: false },
  { name: 'customer_number', label: 'Customer Number', required: false },
  { name: 'minimum_order_value', label: 'Minimum Order Value', required: false },
  { name: 'main_category', label: 'Main Category', required: false }
];

const ARTICLE_IMPORT_FIELDS: ImportField[] = [
  { name: 'name', label: 'Name', required: true },
  { name: 'supplier', label: 'Supplier', required: true },
  { name: 'price', label: 'Price', required: true },
  { name: 'unit', label: 'Unit', required: false },
  { name: 'sku', label: 'SKU', required: false },
  { name: 'category', label: 'Category', required: false },
  { name: 'description', label: 'Description', required: false }
];

const Suppliers = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem, updateQuantity, items: cartItems, getItemsBySupplier } = useCart();

  // Tab state from URL
  const activeTab = searchParams.get('tab') || 'suppliers';
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Supplier tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [topCategoryFilter, setTopCategoryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isSupplierImportOpen, setIsSupplierImportOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [articleImportSupplierId, setArticleImportSupplierId] = useState<string | null>(null);
  const [supplierCategoryPopoverOpen, setSupplierCategoryPopoverOpen] = useState(false);
  const [supplierCustomCategory, setSupplierCustomCategory] = useState('');

  // Article tab state
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [selectedArticleSuppliers, setSelectedArticleSuppliers] = useState<string[]>([]);
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isArticleImportOpen, setIsArticleImportOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [articleCategoryPopoverOpen, setArticleCategoryPopoverOpen] = useState(false);
  const [articleCustomCategory, setArticleCustomCategory] = useState('');
  const [unitPopoverOpen, setUnitPopoverOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState('');
  const [openArticleSuppliers, setOpenArticleSuppliers] = useState<Set<string>>(new Set());

  // Shared data
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: allArticles, isLoading: articlesLoading } = useArticles();
  const { data: dbCategories } = useCategories();

  // Supplier mutations
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const importSuppliers = useImportSuppliers();

  // Article mutations
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();
  const bulkUpdateArticles = useBulkUpdateArticles();
  const importArticles = useImportArticles();

  const { sendInvitation, loading: sendingInvitation } = useSendSupplierInvitation();
  const [invitingSupplierId, setInvitingSupplierId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [changesDialogSupplier, setChangesDialogSupplier] = useState<Supplier | null>(null);
  const [locationsDialogSupplier, setLocationsDialogSupplier] = useState<Supplier | null>(null);
  const { data: pendingChanges } = useSupplierPendingChanges();

  // Local state for multi-select toggles
  const [supplierMultiSelectEnabled, setSupplierMultiSelectEnabled] = useState(() => {
    const saved = localStorage.getItem('suppliers-multi-select');
    return saved === 'true';
  });

  const [articleAdvancedViewEnabled, setArticleAdvancedViewEnabled] = useState(() => {
    const saved = localStorage.getItem('articles-advanced-view');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('suppliers-multi-select', String(supplierMultiSelectEnabled));
  }, [supplierMultiSelectEnabled]);

  useEffect(() => {
    localStorage.setItem('articles-advanced-view', String(articleAdvancedViewEnabled));
  }, [articleAdvancedViewEnabled]);

  useEffect(() => {
    if (!supplierMultiSelectEnabled) {
      setSelectedSuppliers(new Set());
    }
  }, [supplierMultiSelectEnabled]);

  useEffect(() => {
    if (!articleAdvancedViewEnabled) {
      setSelectedArticles(new Set());
    }
  }, [articleAdvancedViewEnabled]);

  // Group pending changes by supplier
  const pendingChangesBySupplier = pendingChanges?.reduce((acc, change) => {
    if (!acc[change.supplier_id]) acc[change.supplier_id] = 0;
    acc[change.supplier_id]++;
    return acc;
  }, {} as Record<string, number>) || {};

  // Fetch organization name for invitation emails
  useEffect(() => {
    const fetchOrgName = async () => {
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single();
        if (org) setOrganizationName(org.name);
      }
    };
    fetchOrgName();
  }, [user]);

  const handleSendInvitation = async (supplier: Supplier) => {
    setInvitingSupplierId(supplier.id);
    await sendInvitation(supplier.id, supplier.email, supplier.name, organizationName);
    setInvitingSupplierId(null);
  };

  // Extract unique categories from suppliers
  const existingSupplierCategories = [...new Set(suppliers?.map(s => s.main_category).filter(Boolean) as string[])].sort();

  // Group articles by supplier
  const articlesBySupplier = allArticles?.reduce((acc, article) => {
    if (!acc[article.supplier_id]) {
      acc[article.supplier_id] = [];
    }
    acc[article.supplier_id].push(article);
    return acc;
  }, {} as Record<string, Article[]>) || {};

  // Extract categories from articles
  const articleDerivedCategories = allArticles?.map(a => a.category).filter(Boolean) as string[] || [];
  const dbCategoryNames = dbCategories?.map(c => c.name) || [];
  const allArticleCategories = [...new Set([...articleDerivedCategories, ...dbCategoryNames])].sort();

  // Extract unique units from articles + defaults
  const existingUnits = [...new Set([
    ...DEFAULT_UNITS,
    ...(allArticles?.map(a => a.unit).filter(Boolean) as string[] || [])
  ])].sort();

  // Supplier functions
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

  const toggleSupplierSelected = (supplierId: string) => {
    setSelectedSuppliers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(supplierId)) {
        newSet.delete(supplierId);
      } else {
        newSet.add(supplierId);
      }
      return newSet;
    });
  };

  const selectAllSuppliers = () => {
    const suppliersWithArticles = filteredSuppliers?.filter(s => (articlesBySupplier[s.id]?.length || 0) > 0) || [];
    if (selectedSuppliers.size === suppliersWithArticles.length) {
      setSelectedSuppliers(new Set());
    } else {
      setSelectedSuppliers(new Set(suppliersWithArticles.map(s => s.id)));
    }
  };

  const handlePrintCombined = () => {
    const selectedSuppliersData = suppliers?.filter(s => selectedSuppliers.has(s.id)) || [];
    generateCombinedOrderListPdf(selectedSuppliersData, articlesBySupplier);
    setSelectedSuppliers(new Set());
  };

  // Article functions
  const toggleArticleSupplier = (supplierId: string) => {
    setOpenArticleSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const toggleArticleSelected = (articleId: string) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const selectAllArticles = () => {
    if (selectedArticles.size === (sortedArticles?.length || 0)) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(sortedArticles?.map(a => a.id) || []));
    }
  };

  const handleBulkCategoryAssign = async (category: string | null) => {
    if (selectedArticles.size === 0) return;
    await bulkUpdateArticles.mutateAsync({
      ids: Array.from(selectedArticles),
      updates: { category: category || undefined }
    });
    setSelectedArticles(new Set());
    setArticleCategoryPopoverOpen(false);
    setArticleCustomCategory('');
  };

  const getCartQuantity = (articleId: string) => {
    const item = cartItems.find(i => i.article.id === articleId);
    return item?.quantity || 0;
  };

  // Forms
  const supplierForm = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '', email: '', phone: '', address: '', contact_person: '',
      customer_number: '', minimum_order_value: '', top_category: '', main_category: ''
    }
  });

  const articleForm = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: { supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '' },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (editingSupplier) {
      supplierForm.reset({
        name: editingSupplier.name,
        email: editingSupplier.email,
        phone: editingSupplier.phone || '',
        address: editingSupplier.address || '',
        contact_person: editingSupplier.contact_person || '',
        customer_number: editingSupplier.customer_number || '',
        minimum_order_value: editingSupplier.minimum_order_value?.toString() || '',
        top_category: editingSupplier.top_category || '',
        main_category: editingSupplier.main_category || ''
      });
    } else {
      supplierForm.reset({
        name: '', email: '', phone: '', address: '', contact_person: '',
        customer_number: '', minimum_order_value: '', top_category: '', main_category: ''
      });
    }
  }, [editingSupplier, supplierForm]);

  useEffect(() => {
    if (editingArticle) {
      articleForm.reset({
        supplier_id: editingArticle.supplier_id,
        name: editingArticle.name,
        description: editingArticle.description || '',
        sku: editingArticle.sku || '',
        unit: editingArticle.unit,
        price: String(editingArticle.price),
        category: editingArticle.category || '',
      });
    } else {
      articleForm.reset({ supplier_id: '', name: '', description: '', sku: '', unit: 'pcs', price: '', category: '' });
    }
  }, [editingArticle, articleForm]);

  const handleSupplierSubmit = async (data: SupplierFormData) => {
    const input: SupplierInput = {
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      address: data.address || undefined,
      contact_person: data.contact_person || undefined,
      customer_number: data.customer_number || undefined,
      minimum_order_value: data.minimum_order_value ? parseFloat(data.minimum_order_value) : undefined,
      top_category: data.top_category || undefined,
      main_category: data.main_category || undefined
    };
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...input });
    } else {
      await createSupplier.mutateAsync(input);
    }
    setIsSupplierDialogOpen(false);
    setEditingSupplier(null);
    supplierForm.reset();
  };

  const handleSupplierDelete = async () => {
    if (deletingSupplier) {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      setDeletingSupplier(null);
    }
  };

  const handleArticleSubmit = async (data: ArticleFormData) => {
    const input: ArticleInput = {
      supplier_id: data.supplier_id,
      name: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      unit: data.unit,
      price: Number(data.price),
      category: data.category || undefined,
    };
    if (editingArticle) {
      await updateArticle.mutateAsync({ id: editingArticle.id, ...input });
    } else {
      await createArticle.mutateAsync(input);
    }
    setIsArticleDialogOpen(false);
    setEditingArticle(null);
    articleForm.reset();
  };

  const handleArticleDelete = async () => {
    if (deletingArticle) {
      await deleteArticle.mutateAsync(deletingArticle.id);
      setDeletingArticle(null);
    }
  };

  // Filtered suppliers
  const filteredSuppliers = suppliers?.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) || supplier.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopCategory = topCategoryFilter === 'all' || supplier.top_category === topCategoryFilter;
    const matchesCategory = categoryFilter === 'all' || supplier.main_category === categoryFilter;
    return matchesSearch && matchesTopCategory && matchesCategory;
  });

  // Filtered articles
  const filteredArticles = allArticles?.filter((article) => {
    const matchesSearch = article.name.toLowerCase().includes(articleSearchQuery.toLowerCase()) ||
      article.description?.toLowerCase().includes(articleSearchQuery.toLowerCase());
    const matchesSupplier = selectedArticleSuppliers.length === 0 || selectedArticleSuppliers.includes(article.supplier_id);
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesSupplier && matchesCategory;
  });

  // Sorted articles
  const sortedArticles = filteredArticles?.slice().sort((a, b) => {
    const supplierA = suppliers?.find(s => s.id === a.supplier_id)?.name || '';
    const supplierB = suppliers?.find(s => s.id === b.supplier_id)?.name || '';
    const supplierCompare = supplierA.localeCompare(supplierB, 'de');
    if (supplierCompare !== 0) return supplierCompare;
    return a.name.localeCompare(b.name, 'de');
  });

  // Group articles by supplier
  const groupedBySupplier = useMemo(() => {
    const groups: { supplier: { id: string; name: string }; articles: typeof sortedArticles }[] = [];
    const groupMap = new Map<string, typeof sortedArticles>();
    
    sortedArticles?.forEach(article => {
      const supplierId = article.supplier_id;
      if (!groupMap.has(supplierId)) {
        groupMap.set(supplierId, []);
      }
      groupMap.get(supplierId)!.push(article);
    });
    
    groupMap.forEach((articles, supplierId) => {
      const supplierName = articles[0]?.suppliers?.name || 'Unbekannt';
      groups.push({ supplier: { id: supplierId, name: supplierName }, articles });
    });
    
    return groups.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name, 'de'));
  }, [sortedArticles]);

  const articleCategoriesForFilter = (allArticles?.map((a) => a.category).filter(Boolean) || []) as string[];

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
            <h1 className="text-3xl font-bold text-foreground">Katalog</h1>
            <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Lieferanten und Artikel</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="suppliers">Lieferanten</TabsTrigger>
            <TabsTrigger value="articles">Alle Artikel</TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            {/* Supplier Actions */}
            <div className="flex flex-wrap gap-2">
              <ExportMenu 
                filename="suppliers" 
                title="Lieferanten" 
                headers={['Name', 'Email', 'Telefon', 'Adresse', 'Ansprechpartner', 'Kundennummer', 'Status']} 
                getData={() => suppliers?.map(s => [s.name, s.email, s.phone || '', s.address || '', s.contact_person || '', s.customer_number || '', s.is_active ? 'Aktiv' : 'Inaktiv']) || []} 
                disabled={!suppliers?.length} 
              />
              <Button variant="outline" onClick={() => setIsSupplierImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importieren
              </Button>
              <Dialog open={isSupplierDialogOpen} onOpenChange={open => {
                setIsSupplierDialogOpen(open);
                if (!open) setEditingSupplier(null);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Lieferant hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingSupplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={supplierForm.handleSubmit(handleSupplierSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Firmenname *</Label>
                      <Input id="name" {...supplierForm.register('name')} placeholder="Fresh Farms Italia" />
                      {supplierForm.formState.errors.name && <p className="text-sm text-destructive">{supplierForm.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" {...supplierForm.register('email')} placeholder="orders@supplier.com" />
                      {supplierForm.formState.errors.email && <p className="text-sm text-destructive">{supplierForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input id="phone" {...supplierForm.register('phone')} placeholder="+39 02 1234567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input id="address" {...supplierForm.register('address')} placeholder="Via Roma 123, Milano" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_person">Ansprechpartner</Label>
                      <Input id="contact_person" {...supplierForm.register('contact_person')} placeholder="Marco Rossi" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_number">Kundennummer</Label>
                      <Input id="customer_number" {...supplierForm.register('customer_number')} placeholder="KD-12345" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimum_order_value">Mindestbestellwert (€)</Label>
                      <Input id="minimum_order_value" type="number" step="0.01" min="0" {...supplierForm.register('minimum_order_value')} placeholder="50.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Oberkategorie</Label>
                      <Select value={supplierForm.watch('top_category') || ''} onValueChange={value => supplierForm.setValue('top_category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Oberkategorie auswählen..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border z-50">
                          {TOP_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hauptkategorie</Label>
                      <Popover open={supplierCategoryPopoverOpen} onOpenChange={setSupplierCategoryPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" aria-expanded={supplierCategoryPopoverOpen} className="w-full justify-between font-normal">
                            {supplierForm.watch('main_category') || "Kategorie auswählen..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-popover border border-border z-50" align="start">
                          <Command>
                            <CommandInput placeholder="Kategorie suchen oder eingeben..." value={supplierCustomCategory} onValueChange={setSupplierCustomCategory} />
                            <CommandList>
                              <CommandEmpty>
                                {supplierCustomCategory && (
                                  <button type="button" className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent cursor-pointer" onClick={() => {
                                    supplierForm.setValue('main_category', supplierCustomCategory);
                                    setSupplierCustomCategory('');
                                    setSupplierCategoryPopoverOpen(false);
                                  }}>
                                    "{supplierCustomCategory}" hinzufügen
                                  </button>
                                )}
                              </CommandEmpty>
                              <CommandGroup>
                                {existingSupplierCategories.map(category => (
                                  <CommandItem key={category} value={category} onSelect={() => {
                                    supplierForm.setValue('main_category', category);
                                    setSupplierCategoryPopoverOpen(false);
                                  }}>
                                    <Check className={cn("mr-2 h-4 w-4", supplierForm.watch('main_category') === category ? "opacity-100" : "opacity-0")} />
                                    {category}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {editingSupplier && (
                      <div className="pt-2">
                        <Button type="button" variant="outline" className="w-full" onClick={() => {
                          setArticleImportSupplierId(editingSupplier.id);
                          setIsSupplierDialogOpen(false);
                        }}>
                          <Package className="w-4 h-4 mr-2" />
                          Artikel für {editingSupplier.name} importieren
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => {
                        setIsSupplierDialogOpen(false);
                        setEditingSupplier(null);
                      }}>
                        Abbrechen
                      </Button>
                      <Button type="submit" className="flex-1" disabled={createSupplier.isPending || updateSupplier.isPending}>
                        {createSupplier.isPending || updateSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSupplier ? 'Speichern' : 'Erstellen'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Supplier Import */}
            <CsvImportDialog open={isSupplierImportOpen} onOpenChange={setIsSupplierImportOpen} title="Lieferanten importieren" fields={SUPPLIER_IMPORT_FIELDS} onImport={async data => {
              await importSuppliers.mutateAsync(data);
            }} templateFileName="suppliers_template.csv" />

            {/* Article Import Dialog for specific supplier */}
            <CsvImportDialog open={!!articleImportSupplierId} onOpenChange={open => !open && setArticleImportSupplierId(null)} title={`Artikel importieren für ${suppliers?.find(s => s.id === articleImportSupplierId)?.name || 'Lieferant'}`} fields={ARTICLE_IMPORT_FIELDS} onImport={async data => {
              if (articleImportSupplierId) {
                await importArticles.mutateAsync({
                  articles: data,
                  defaultSupplierId: articleImportSupplierId
                });
              }
            }} templateFileName="articles_template.csv" />

            {/* Supplier Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Lieferanten suchen..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={topCategoryFilter} onValueChange={setTopCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card">
                  <SelectValue placeholder="Oberkategorie" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="all">Alle Oberkategorien</SelectItem>
                  {TOP_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-card">
                  <SelectValue placeholder="Hauptkategorie" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {existingSupplierCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Switch id="multi-select" checked={supplierMultiSelectEnabled} onCheckedChange={setSupplierMultiSelectEnabled} />
                <Label htmlFor="multi-select" className="text-sm cursor-pointer whitespace-nowrap">Mehrfachauswahl</Label>
              </div>
              {supplierMultiSelectEnabled && selectedSuppliers.size > 0 && (
                <Button onClick={handlePrintCombined} variant="secondary">
                  <Printer className="w-4 h-4 mr-2" />
                  {selectedSuppliers.size} Listen drucken
                </Button>
              )}
            </div>

            {/* Suppliers Table */}
            {suppliersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredSuppliers?.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">
                  {searchQuery || topCategoryFilter !== 'all' || categoryFilter !== 'all' ? 'Keine Lieferanten gefunden' : 'Noch keine Lieferanten. Fügen Sie Ihren ersten Lieferanten hinzu.'}
                </p>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {supplierMultiSelectEnabled && (
                        <TableHead className="w-10">
                          <Checkbox checked={selectedSuppliers.size > 0 && selectedSuppliers.size === (filteredSuppliers?.filter(s => (articlesBySupplier[s.id]?.length || 0) > 0).length || 0)} onCheckedChange={selectAllSuppliers} />
                        </TableHead>
                      )}
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Lieferant</TableHead>
                      <TableHead className="hidden md:table-cell">Kategorie</TableHead>
                      <TableHead className="hidden lg:table-cell">Artikel</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers?.map(supplier => {
                      const supplierArticles = articlesBySupplier[supplier.id] || [];
                      const isExpanded = expandedSuppliers.has(supplier.id);
                      const hasArticles = supplierArticles.length > 0;
                      return (
                        <Fragment key={supplier.id}>
                          <TableRow className="group">
                            {supplierMultiSelectEnabled && (
                              <TableCell className="py-2">
                                {hasArticles && <Checkbox checked={selectedSuppliers.has(supplier.id)} onCheckedChange={() => toggleSupplierSelected(supplier.id)} />}
                              </TableCell>
                            )}
                            <TableCell className="py-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSupplierExpanded(supplier.id)} disabled={supplierArticles.length === 0}>
                                {supplierArticles.length > 0 ? isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" /> : <span className="w-4 h-4" />}
                              </Button>
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium text-foreground">{supplier.name}</p>
                                  <p className="text-xs text-muted-foreground">{supplier.phone || '-'}</p>
                                </div>
                                {pendingChangesBySupplier[supplier.id] > 0 && (
                                  <Badge variant="destructive" className="cursor-pointer animate-pulse" onClick={() => setChangesDialogSupplier(supplier)}>
                                    <Bell className="w-3 h-3 mr-1" />
                                    {pendingChangesBySupplier[supplier.id]}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground py-2">
                              <p className="text-sm text-primary font-medium">
                                {supplier.top_category && supplier.main_category ? `${supplier.top_category} › ${supplier.main_category}` : supplier.top_category || supplier.main_category || '-'}
                              </p>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell py-2">
                              <Badge variant="secondary">{supplierArticles.length} Artikel</Badge>
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setLocationsDialogSupplier(supplier)} title="Standort-Zuordnungen">
                                  <Store className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => handleSendInvitation(supplier)} disabled={invitingSupplierId === supplier.id || sendingInvitation} title="Einladung zum Lieferantenportal senden">
                                  {invitingSupplierId === supplier.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                </Button>
                                {supplierArticles.length > 0 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => generateOrderListPdf(supplier, supplierArticles)} title="Bestellliste drucken">
                                    <FileText className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingSupplier(supplier); setIsSupplierDialogOpen(true); }}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingSupplier(supplier)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {/* Expanded articles section */}
                          {isExpanded && supplierArticles.length > 0 && (
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-4 pl-16">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="hover:bg-transparent border-b border-border/50">
                                        <TableHead className="h-8 text-xs text-center w-[80px]">Menge</TableHead>
                                        <TableHead className="h-8 text-xs">Artikel</TableHead>
                                        <TableHead className="h-8 text-xs hidden md:table-cell">Beschreibung</TableHead>
                                        <TableHead className="h-8 text-xs text-right">Preis</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {supplierArticles.map(article => {
                                        const cartQty = getCartQuantity(article.id);
                                        return (
                                          <TableRow key={article.id} className={`border-b border-border/30 hover:bg-muted/50 ${cartQty > 0 ? 'bg-destructive/10 text-destructive' : ''}`}>
                                            <TableCell className="py-1.5">
                                              <Input
                                                type="text"
                                                inputMode="numeric"
                                                value={cartQty || ''}
                                                onChange={(e) => {
                                                  const val = parseInt(e.target.value) || 0;
                                                  if (val === 0) {
                                                    updateQuantity(article.id, 0);
                                                  } else if (cartQty === 0) {
                                                    addItem(article, val);
                                                  } else {
                                                    updateQuantity(article.id, val);
                                                  }
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                className={`w-16 h-8 text-center text-sm ${cartQty > 0 ? 'border-destructive bg-destructive/10 text-destructive font-medium' : ''}`}
                                                placeholder="0"
                                              />
                                            </TableCell>
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
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-4">
            {/* Article Actions */}
            <div className="flex flex-wrap gap-2">
              <ExportMenu
                filename="articles"
                title="Artikel"
                headers={['Name', 'Lieferant', 'Preis', 'Einheit', 'SKU', 'Kategorie', 'Status']}
                getData={() => allArticles?.map(a => [
                  a.name,
                  a.suppliers?.name || '',
                  `€${Number(a.price).toFixed(2)}`,
                  a.unit,
                  a.sku || '',
                  a.category || '',
                  a.is_active ? 'Aktiv' : 'Inaktiv'
                ]) || []}
                disabled={!allArticles?.length}
              />
              <Button variant="outline" onClick={() => setIsArticleImportOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Importieren
              </Button>
              <Dialog open={isArticleDialogOpen} onOpenChange={(open) => {
                setIsArticleDialogOpen(open);
                if (!open) setEditingArticle(null);
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Artikel hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={articleForm.handleSubmit(handleArticleSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Lieferant *</Label>
                      <Controller
                        name="supplier_id"
                        control={articleForm.control}
                        render={({ field }) => {
                          const selectedSupplierData = suppliers?.find(s => s.id === field.value);
                          return (
                            <>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="bg-card">
                                  <SelectValue placeholder="Lieferant auswählen" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border border-border z-50">
                                  {suppliers?.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {selectedSupplierData && (selectedSupplierData.top_category || selectedSupplierData.main_category) && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                  {selectedSupplierData.top_category && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Oberkategorie: </span>
                                      <span className="text-foreground">{selectedSupplierData.top_category}</span>
                                    </div>
                                  )}
                                  {selectedSupplierData.main_category && (
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Hauptkategorie: </span>
                                      <span className="text-foreground">{selectedSupplierData.main_category}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        }}
                      />
                      {articleForm.formState.errors.supplier_id && (
                        <p className="text-sm text-destructive">{articleForm.formState.errors.supplier_id.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="article-name">Name *</Label>
                      <Input id="article-name" {...articleForm.register('name')} placeholder="San Marzano Tomatoes" />
                      {articleForm.formState.errors.name && (
                        <p className="text-sm text-destructive">{articleForm.formState.errors.name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="article-description">Beschreibung</Label>
                      <Input id="article-description" {...articleForm.register('description')} placeholder="Premium italienische Tomaten" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="article-price">Preis (€) *</Label>
                        <Input id="article-price" type="number" step="0.01" {...articleForm.register('price')} placeholder="4.50" />
                        {articleForm.formState.errors.price && (
                          <p className="text-sm text-destructive">{articleForm.formState.errors.price.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Einheit *</Label>
                        <Controller
                          name="unit"
                          control={articleForm.control}
                          render={({ field }) => (
                            <Popover open={unitPopoverOpen} onOpenChange={setUnitPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={unitPopoverOpen} className="w-full justify-between bg-card">
                                  {field.value || "Auswählen"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Einheit suchen..." value={customUnit} onValueChange={setCustomUnit} />
                                  <CommandList>
                                    <CommandEmpty>
                                      {customUnit && (
                                        <Button variant="ghost" className="w-full justify-start" onClick={() => {
                                          field.onChange(customUnit);
                                          setUnitPopoverOpen(false);
                                          setCustomUnit('');
                                        }}>
                                          <Plus className="mr-2 h-4 w-4" />
                                          "{customUnit}" hinzufügen
                                        </Button>
                                      )}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {existingUnits.map((unit) => (
                                        <CommandItem key={unit} value={unit} onSelect={() => {
                                          field.onChange(unit);
                                          setUnitPopoverOpen(false);
                                          setCustomUnit('');
                                        }}>
                                          <Check className={cn("mr-2 h-4 w-4", field.value === unit ? "opacity-100" : "opacity-0")} />
                                          {unit}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="article-sku">SKU</Label>
                        <Input id="article-sku" {...articleForm.register('sku')} placeholder="TOM-001" />
                      </div>
                      <div className="space-y-2">
                        <Label>Kategorie</Label>
                        <Controller
                          name="category"
                          control={articleForm.control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <SelectTrigger className="bg-card">
                                <SelectValue placeholder="Auswählen" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border border-border z-50">
                                {allArticleCategories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => {
                        setIsArticleDialogOpen(false);
                        setEditingArticle(null);
                      }}>
                        Abbrechen
                      </Button>
                      <Button type="submit" className="flex-1" disabled={createArticle.isPending || updateArticle.isPending}>
                        {(createArticle.isPending || updateArticle.isPending) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : editingArticle ? 'Speichern' : 'Erstellen'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <CsvImportDialog
              open={isArticleImportOpen}
              onOpenChange={setIsArticleImportOpen}
              title="Artikel importieren"
              fields={ARTICLE_IMPORT_FIELDS}
              onImport={async (data, defaultSupplierId) => {
                await importArticles.mutateAsync({ articles: data, defaultSupplierId });
              }}
              templateFileName="articles_template.csv"
              suppliers={suppliers?.map(s => ({ id: s.id, name: s.name }))}
              showSupplierSelect={true}
            />

            {/* Article Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Artikel suchen..." value={articleSearchQuery} onChange={(e) => setArticleSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-56 justify-between bg-card">
                    {selectedArticleSuppliers.length === 0 
                      ? "Alle Lieferanten" 
                      : `${selectedArticleSuppliers.length} Lieferant${selectedArticleSuppliers.length > 1 ? 'en' : ''}`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 bg-popover border border-border z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Lieferanten suchen..." />
                    <CommandList>
                      <CommandEmpty>Keine Lieferanten gefunden</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => {
                          if (selectedArticleSuppliers.length === (suppliers?.length || 0)) {
                            setSelectedArticleSuppliers([]);
                          } else {
                            setSelectedArticleSuppliers(suppliers?.map(s => s.id) || []);
                          }
                        }}>
                          <Checkbox checked={selectedArticleSuppliers.length === (suppliers?.length || 0) && suppliers?.length > 0} className="mr-2" />
                          Alle auswählen
                        </CommandItem>
                      </CommandGroup>
                      <CommandGroup>
                        {suppliers?.sort((a, b) => a.name.localeCompare(b.name)).map((supplier) => (
                          <CommandItem key={supplier.id} value={supplier.name} onSelect={() => {
                            setSelectedArticleSuppliers(prev => 
                              prev.includes(supplier.id)
                                ? prev.filter(id => id !== supplier.id)
                                : [...prev, supplier.id]
                            );
                          }}>
                            <Checkbox checked={selectedArticleSuppliers.includes(supplier.id)} className="mr-2" />
                            {supplier.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <CategoryFilterDropdown 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                articleCategories={articleCategoriesForFilter}
              />
              {(articleSearchQuery || selectedArticleSuppliers.length > 0 || selectedCategory !== 'all') && (
                <Button variant="ghost" size="icon" onClick={() => {
                  setArticleSearchQuery('');
                  setSelectedArticleSuppliers([]);
                  setSelectedCategory('all');
                }} title="Filter zurücksetzen">
                  <X className="w-4 h-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Switch id="advanced-view" checked={articleAdvancedViewEnabled} onCheckedChange={setArticleAdvancedViewEnabled} />
                <Label htmlFor="advanced-view" className="text-sm cursor-pointer whitespace-nowrap">Mehrfachauswahl</Label>
              </div>
              <div className="flex border border-border rounded-lg overflow-hidden">
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="icon" className="rounded-none h-10 w-10" onClick={() => setViewMode('list')}>
                  <List className="w-4 h-4" />
                </Button>
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="icon" className="rounded-none h-10 w-10" onClick={() => setViewMode('grid')}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Selection Toolbar */}
            {articleAdvancedViewEnabled && selectedArticles.size > 0 && (
              <div className="flex items-center gap-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <span className="text-sm font-medium">{selectedArticles.size} Artikel ausgewählt</span>
                <Popover open={articleCategoryPopoverOpen} onOpenChange={setArticleCategoryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Tags className="w-4 h-4 mr-2" />
                      Kategorie zuweisen
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 bg-popover border border-border z-50" align="start">
                    <Command>
                      <CommandInput placeholder="Kategorie suchen oder eingeben..." value={articleCustomCategory} onValueChange={setArticleCustomCategory} />
                      <CommandList>
                        <CommandEmpty>
                          {articleCustomCategory && (
                            <button type="button" className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent cursor-pointer" onClick={() => handleBulkCategoryAssign(articleCustomCategory)}>
                              "{articleCustomCategory}" hinzufügen
                            </button>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          <CommandItem value="__remove__" onSelect={() => handleBulkCategoryAssign(null)} className="text-destructive">
                            Kategorie entfernen
                          </CommandItem>
                          {allArticleCategories.map((category) => (
                            <CommandItem key={category} value={category} onSelect={() => handleBulkCategoryAssign(category)}>
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="sm" onClick={() => setSelectedArticles(new Set())}>
                  Auswahl aufheben
                </Button>
              </div>
            )}

            {/* Articles List/Grid */}
            {articlesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedArticles?.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {articleSearchQuery || selectedArticleSuppliers.length > 0 || selectedCategory !== 'all'
                    ? 'Keine Artikel gefunden'
                    : 'Noch keine Artikel. Fügen Sie Ihren ersten Artikel hinzu.'}
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {articleAdvancedViewEnabled && (
                        <TableHead className="w-[40px]">
                          <Checkbox checked={sortedArticles?.length > 0 && selectedArticles.size === sortedArticles?.length} onCheckedChange={selectAllArticles} />
                        </TableHead>
                      )}
                      <TableHead className="text-center w-[140px]">Menge</TableHead>
                      <TableHead className="w-[25%]">Artikel</TableHead>
                      <TableHead className="hidden md:table-cell w-[25%]">Beschreibung</TableHead>
                      <TableHead className="hidden sm:table-cell">Lieferant</TableHead>
                      <TableHead className="text-right">Preis</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedBySupplier.map((group) => (
                      <Collapsible key={group.supplier.id} open={openArticleSuppliers.has(group.supplier.id)} onOpenChange={() => toggleArticleSupplier(group.supplier.id)} asChild>
                        <Fragment>
                          <CollapsibleTrigger asChild>
                            <TableRow className={cn(
                              "bg-muted/50 cursor-pointer",
                              getItemsBySupplier().has(group.supplier.id) && "bg-destructive/20"
                            )}>
                              <TableCell colSpan={articleAdvancedViewEnabled ? 6 : 5} className="py-2 px-4">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className={cn("h-4 w-4 transition-transform", openArticleSuppliers.has(group.supplier.id) && "rotate-90")} />
                                  <span className={cn(
                                    "font-semibold text-sm",
                                    getItemsBySupplier().has(group.supplier.id) ? "text-destructive" : "text-foreground"
                                  )}>{group.supplier.name}</span>
                                  <span className="text-xs text-muted-foreground">({group.articles?.length || 0} Artikel)</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <Fragment>
                              {group.articles?.map((article) => {
                                const cartQty = getCartQuantity(article.id);
                                return (
                                  <TableRow key={article.id} className={cn("group h-10", cartQty > 0 && "bg-destructive/10")}>
                                    {articleAdvancedViewEnabled && (
                                      <TableCell className="py-2">
                                        <Checkbox checked={selectedArticles.has(article.id)} onCheckedChange={() => toggleArticleSelected(article.id)} />
                                      </TableCell>
                                    )}
                                    <TableCell className="py-2">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(article.id, cartQty - 1)} disabled={cartQty === 0}>
                                          <Minus className="w-3 h-3" />
                                        </Button>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={cartQty}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (!isNaN(val) && val >= 0) {
                                              updateQuantity(article.id, val);
                                            } else if (e.target.value === '') {
                                              updateQuantity(article.id, 0);
                                            }
                                          }}
                                          onFocus={(e) => {
                                            const target = e.target;
                                            setTimeout(() => target.select(), 0);
                                          }}
                                          className={cn(
                                            "w-12 h-8 text-center font-medium rounded-md border border-input bg-background",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                                            cartQty > 0 ? "text-destructive" : "text-foreground"
                                          )}
                                        />
                                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => addItem(article, 1)}>
                                          <Plus className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <div className="flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-foreground truncate">{article.name}</p>
                                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="sm:hidden truncate">{article.suppliers?.name}</span>
                                            {article.category && <span className="text-primary font-medium">{article.category}</span>}
                                            {article.sku && <span className="text-muted-foreground">SKU: {article.sku}</span>}
                                          </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingArticle(article); setIsArticleDialogOpen(true); }}>
                                            <Pencil className="w-3 h-3" />
                                          </Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingArticle(article)}>
                                            <Trash2 className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground py-2">
                                      <p className="truncate max-w-[200px]" title={article.description || ''}>{article.description || '-'}</p>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-muted-foreground py-2">{article.suppliers?.name}</TableCell>
                                    <TableCell className="text-right font-medium py-2">
                                      <div className="flex items-center justify-end gap-1">
                                        <span>
                                          €{Number(article.price).toFixed(2)}
                                          <span className="text-xs text-muted-foreground ml-1">/{article.unit}</span>
                                        </span>
                                        <PriceHistoryPopover articleId={article.id} articleName={article.name} />
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </Fragment>
                          </CollapsibleContent>
                        </Fragment>
                      </Collapsible>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Grid View */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedArticles?.map((article) => {
                  const cartQty = getCartQuantity(article.id);
                  return (
                    <div key={article.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{article.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{article.suppliers?.name}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingArticle(article); setIsArticleDialogOpen(true); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingArticle(article)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {article.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{article.description}</p>
                      )}
                      <div className="flex items-center gap-2 mb-4">
                        {article.category && <Badge variant="secondary" className="text-xs">{article.category}</Badge>}
                        {article.sku && <span className="text-xs text-muted-foreground">SKU: {article.sku}</span>}
                      </div>
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-2xl font-bold text-foreground">€{Number(article.price).toFixed(2)}</span>
                            <PriceHistoryPopover articleId={article.id} articleName={article.name} />
                          </div>
                          <span className="text-sm text-muted-foreground">/{article.unit}</span>
                        </div>
                        {cartQty > 0 ? (
                          <div className="flex items-center justify-between bg-muted rounded-lg p-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateQuantity(article.id, cartQty - 1)}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-medium text-foreground">{cartQty}</span>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => addItem(article, 1)}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button className="w-full" onClick={() => addItem(article, 1)}>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            In den Warenkorb
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Supplier Delete Confirmation */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={() => setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie "{deletingSupplier?.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleSupplierDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteSupplier.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Article Delete Confirmation */}
      <AlertDialog open={!!deletingArticle} onOpenChange={() => setDeletingArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie "{deletingArticle?.name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleArticleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteArticle.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Supplier Changes Dialog */}
      <SupplierChangesDialog
        open={!!changesDialogSupplier}
        onOpenChange={(open) => !open && setChangesDialogSupplier(null)}
        supplierId={changesDialogSupplier?.id || null}
        supplierName={changesDialogSupplier?.name || ''}
      />

      {/* Supplier Locations Dialog */}
      {locationsDialogSupplier && (
        <SupplierLocationsDialog
          open={!!locationsDialogSupplier}
          onOpenChange={(open) => !open && setLocationsDialogSupplier(null)}
          supplier={locationsDialogSupplier}
        />
      )}
    </DashboardLayout>
  );
};

export default Suppliers;
