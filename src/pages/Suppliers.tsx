import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { DashboardLayout, useSidebarContext } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { useSuppliers, useSuppliersByLocation, useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useSupplierLocations } from '@/hooks/useSupplierLocations';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog';
import { useArticles, useCreateArticle, useUpdateArticle, useDeleteArticle, useBulkUpdateArticles, Article, ArticleInput } from '@/hooks/useArticles';
import { useArticleLocationsByLocation } from '@/hooks/useArticleLocations';
import { Plus, Loader2, Upload, Package } from 'lucide-react';
import { useArticleImageUpload } from '@/hooks/useArticleImageUpload';
import { useSendSupplierInvitation } from '@/hooks/useSupplierPortal';
import { generateOrderListPdf, generateCombinedOrderListPdf } from '@/lib/orderListPdf';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { useImportSuppliers, useImportArticles } from '@/hooks/useImport';
import { supabase } from '@/integrations/supabase/client';
import { ExportMenu } from '@/components/ExportMenu';
import { useSupplierPendingChanges, useCombinedPendingBySupplier, usePendingArticleIds, useRecentlyActiveSuppliers } from '@/hooks/useSupplierChanges';
import { useLastOrderByArticle } from '@/hooks/useLastOrderByArticle';
import { SupplierChangesDialog } from '@/components/suppliers/SupplierChangesDialog';
import { SupplierLocationsDialog } from '@/components/suppliers/SupplierLocationsDialog';
import { useCategories } from '@/hooks/useCategories';
import { useOrderUnits } from '@/hooks/useOrderUnits';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

// Refactored components
import { SUPPLIER_IMPORT_FIELDS, ARTICLE_IMPORT_FIELDS, DEFAULT_UNITS } from '@/components/suppliers/constants';
import { ArticleFormData } from '@/components/suppliers/schemas';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { ArticleFormDialog } from '@/components/suppliers/ArticleFormDialog';
import { SupplierFilters } from '@/components/suppliers/SupplierFilters';
import { ArticleFilters } from '@/components/suppliers/ArticleFilters';
import { SupplierTable } from '@/components/suppliers/SupplierTable';
import { ArticleTable } from '@/components/suppliers/ArticleTable';
import { BulkCategoryToolbar } from '@/components/suppliers/BulkCategoryToolbar';
import { DeleteConfirmationDialogs } from '@/components/suppliers/DeleteConfirmationDialogs';
import { SuggestionsTab } from '@/components/suppliers/SuggestionsTab';
import { useSuggestedArticlesCount } from '@/hooks/useSuggestedArticles';
import { QuickCaptureWizard } from '@/components/suppliers/QuickCaptureWizard';
import { WinesTab } from '@/components/suppliers/WinesTab';
import { SupplierQRCodeDialog } from '@/components/suppliers/SupplierQRCodeDialog';
import { SupplierTokensDialog } from '@/components/suppliers/SupplierTokensDialog';

const Suppliers = () => {
  const { t } = useTranslation();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state from URL
  const activeTab = searchParams.get('tab') || 'suppliers';
  const setActiveTab = (tab: string) => {
    setSearchParams({
      tab
    });
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

  // Article tab state
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [selectedArticleSuppliers, setSelectedArticleSuppliers] = useState<string[]>([]);
  const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isArticleDialogOpen, setIsArticleDialogOpen] = useState(false);
  const [isArticleImportOpen, setIsArticleImportOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [preselectedSupplierId, setPreselectedSupplierId] = useState<string | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<Article | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [openArticleSuppliers, setOpenArticleSuppliers] = useState<Set<string>>(new Set());

  // Location context for location-specific customer numbers
  const { activeLocation } = useLocationContext();
  const { data: supplierLocations } = useSupplierLocations();

  // Helper function to get location-specific customer number
  const getLocationCustomerNumber = useCallback((supplierId: string) => {
    if (!activeLocation || !supplierLocations) return null;
    const locationLink = supplierLocations.find(
      sl => sl.supplier_id === supplierId && sl.location_id === activeLocation.id
    );
    return locationLink?.customer_number || null;
  }, [activeLocation, supplierLocations]);

  // Shared data - all suppliers for reference (e.g., for dropdown, etc.)
  const {
    data: allSuppliers,
    isLoading: suppliersLoading
  } = useSuppliers();
  
  // Location-filtered suppliers - show only suppliers assigned to active location
  const {
    data: locationSuppliers
  } = useSuppliersByLocation(activeLocation?.id);
  
  // Use location-filtered suppliers as primary, fallback to all suppliers
  const suppliers = locationSuppliers ?? allSuppliers;
  
  const {
    data: allArticles,
    isLoading: articlesLoading
  } = useArticles();
  
  // Article locations for filtering by active location
  const {
    data: articleLocations
  } = useArticleLocationsByLocation(activeLocation?.id);
  
  // Filter articles to only those available at active location
  const locationArticleIds = useMemo(() => {
    if (!articleLocations) return null;
    return new Set(articleLocations.map(al => al.article_id));
  }, [articleLocations]);
  
  const {
    data: dbCategories
  } = useCategories();
  const {
    data: orderUnits
  } = useOrderUnits();

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
  const {
    sendInvitation,
    loading: sendingInvitation
  } = useSendSupplierInvitation();
  const [invitingSupplierId, setInvitingSupplierId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');
  const [changesDialogSupplier, setChangesDialogSupplier] = useState<Supplier | null>(null);
  const [changesDialogArticle, setChangesDialogArticle] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [locationsDialogSupplier, setLocationsDialogSupplier] = useState<Supplier | null>(null);
  const {
    data: pendingChanges
  } = useSupplierPendingChanges();
  const {
    data: pendingChangesBySupplier
  } = useCombinedPendingBySupplier();
  const {
    data: pendingArticleIds
  } = usePendingArticleIds();
  const {
    data: recentlyActiveSuppliers
  } = useRecentlyActiveSuppliers();
  const {
    data: lastOrderMap
  } = useLastOrderByArticle();
  const {
    data: suggestionsCount
  } = useSuggestedArticlesCount();

  // Subscription limits
  const subscriptionLimits = useSubscriptionLimits();
  const [showSupplierUpgradeDialog, setShowSupplierUpgradeDialog] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [qrCodeSupplier, setQrCodeSupplier] = useState<Supplier | null>(null);
  const [tokensDialogSupplier, setTokensDialogSupplier] = useState<Supplier | null>(null);
  // Local state for multi-select toggles
  const [supplierMultiSelectEnabled, setSupplierMultiSelectEnabled] = useState(() => {
    const saved = localStorage.getItem('suppliers-multi-select');
    return saved === 'true';
  });
  const [articleAdvancedViewEnabled, setArticleAdvancedViewEnabled] = useState(() => {
    const saved = localStorage.getItem('articles-advanced-view');
    return saved === 'true';
  });

  // Advanced settings mode for export/import visibility
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(() => {
    return localStorage.getItem('advanced-settings-enabled') === 'true';
  });

  // Listen for changes to advanced settings from Settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedSettingsEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
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

  // pendingChangesBySupplier now comes from useCombinedPendingBySupplier hook

  // Fetch organization name and ID for invitation emails and quick capture
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!user) return;
      const {
        data: profile
      } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id);
        const {
          data: org
        } = await supabase.from('organizations').select('name').eq('id', profile.organization_id).single();
        if (org) setOrganizationName(org.name);
      }
    };
    fetchOrgData();
  }, [user]);
  const handleSendInvitation = async (supplier: Supplier) => {
    setInvitingSupplierId(supplier.id);
    await sendInvitation(supplier.id, supplier.email, supplier.name, organizationName);
    setInvitingSupplierId(null);
  };
  const handleOpenPortal = async (supplier: Supplier) => {
    // Fenster sofort öffnen (direkte Benutzeraktion - wird nicht blockiert)
    const newWindow = window.open('', '_blank');
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-supplier-portal-token', {
        body: {
          supplierId: supplier.id
        }
      });
      if (error) throw error;

      // URL setzen, nachdem Token geladen ist
      if (newWindow) {
        newWindow.location.href = data.portalUrl;
      }
    } catch (error: any) {
      console.error('Error opening portal:', error);
      // Fenster schließen bei Fehler
      if (newWindow) {
        newWindow.close();
      }
      const {
        toast
      } = await import('sonner');
      toast.error('Fehler beim Öffnen des Portals: ' + error.message);
    }
  };

  // Filter articles by location (only show articles available at active location)
  const locationFilteredArticles = useMemo(() => {
    if (!allArticles) return [];
    // If no locationArticleIds, show all articles (no filtering)
    if (!locationArticleIds) return allArticles;
    return allArticles.filter(article => locationArticleIds.has(article.id));
  }, [allArticles, locationArticleIds]);

  // Extract article categories for supplier filter (from location-filtered articles)
  const articleCategoriesForSupplierFilter = [...new Set(locationFilteredArticles?.map(a => a.category).filter(Boolean) as string[])].sort();

  // Group articles by supplier (from location-filtered articles)
  const articlesBySupplier = locationFilteredArticles?.reduce((acc, article) => {
    if (!acc[article.supplier_id]) {
      acc[article.supplier_id] = [];
    }
    acc[article.supplier_id].push(article);
    return acc;
  }, {} as Record<string, Article[]>) || {};

  // Extract categories from articles (location-filtered)
  const articleDerivedCategories = locationFilteredArticles?.map(a => a.category).filter(Boolean) as string[] || [];
  const dbCategoryNames = dbCategories?.map(c => c.name) || [];
  const allArticleCategories = [...new Set([...articleDerivedCategories, ...dbCategoryNames])].sort();

  // Extract unique units from articles + defaults (location-filtered)
  const existingUnits = [...new Set([...DEFAULT_UNITS, ...(locationFilteredArticles?.map(a => a.unit).filter(Boolean) as string[] || [])])].sort();

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
  const handlePrintCombined = async () => {
    const selectedSuppliersData = suppliers?.filter(s => selectedSuppliers.has(s.id)) || [];
    // Enrich articles with last order quantities
    const enrichedArticlesBySupplier = Object.fromEntries(Object.entries(articlesBySupplier).map(([supplierId, articles]) => [supplierId, articles.map(a => ({
      name: a.name,
      unit: a.unit,
      sku: a.sku,
      description: a.description,
      lastOrderQuantity: lastOrderMap?.[a.id]?.quantity,
      lastOrderDate: lastOrderMap?.[a.id]?.date
    }))]));
    await generateCombinedOrderListPdf(selectedSuppliersData, enrichedArticlesBySupplier);
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
  const handleBulkCategoryAssign = async (category: string | null) => {
    if (selectedArticles.size === 0) return;
    await bulkUpdateArticles.mutateAsync({
      ids: Array.from(selectedArticles),
      updates: {
        category: category || undefined
      }
    });
    setSelectedArticles(new Set());
  };
  const handleBulkOrderUnitAssign = async (orderUnitId: string | null) => {
    if (selectedArticles.size === 0) return;
    await bulkUpdateArticles.mutateAsync({
      ids: Array.from(selectedArticles),
      updates: {
        order_unit_id: orderUnitId || undefined
      }
    });
    setSelectedArticles(new Set());
  };
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Supplier submit handler with limit check
  const handleSupplierSubmit = async (input: SupplierInput) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({
        id: editingSupplier.id,
        ...input
      });
    } else {
      // Check subscription limit before creating
      if (!subscriptionLimits.canAddSupplier) {
        setShowSupplierUpgradeDialog(true);
        return;
      }
      await createSupplier.mutateAsync(input);
    }
    setIsSupplierDialogOpen(false);
    setEditingSupplier(null);
  };

  // Handler for opening supplier dialog with limit check
  const handleOpenSupplierDialog = () => {
    if (!subscriptionLimits.canAddSupplier) {
      setShowSupplierUpgradeDialog(true);
      return;
    }
    setEditingSupplier(null);
    setIsSupplierDialogOpen(true);
  };
  const handleSupplierDelete = async () => {
    if (deletingSupplier) {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      setDeletingSupplier(null);
    }
  };

  // Article image upload
  const {
    uploadImage,
    deleteImage
  } = useArticleImageUpload();

  // Article submit handler
  const handleArticleSubmit = async (data: ArticleFormData, capturedImage?: string, imageCleared?: boolean) => {
    const input: ArticleInput = {
      supplier_id: data.supplier_id,
      name: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      unit: data.unit,
      price: Number(data.price),
      category: data.category || undefined,
      origin_country: data.origin_country || undefined,
      packaging_unit: data.packaging_unit ? Number(data.packaging_unit) : undefined,
      order_unit_id: data.order_unit_id || undefined,
      reference_price: data.reference_price ? Number(data.reference_price.replace(',', '.')) : undefined,
      reference_unit: data.reference_unit || undefined,
      selling_price: data.selling_price ? Number(data.selling_price) : undefined,
      grape_variety: data.grape_variety || undefined,
      flavor_profile: data.flavor_profile || undefined,
      food_pairings: data.food_pairings || undefined
    };
    if (editingArticle) {
      // Case 1: Image was explicitly cleared
      if (imageCleared && editingArticle.image_url) {
        await deleteImage(editingArticle.organization_id, editingArticle.id);
        input.image_url = null;
      }
      // Case 2: New image uploaded (replaces old)
      else if (capturedImage && capturedImage.startsWith('data:')) {
        // Delete old image if exists
        if (editingArticle.image_url) {
          await deleteImage(editingArticle.organization_id, editingArticle.id);
        }
        const imageUrl = await uploadImage(capturedImage, editingArticle.organization_id, editingArticle.id);
        if (imageUrl) {
          input.image_url = imageUrl;
        }
      }
      // Case 3: Image unchanged → don't touch image_url

      await updateArticle.mutateAsync({
        id: editingArticle.id,
        ...input
      });
    } else {
      // Create article first, then upload image
      const newArticle = await createArticle.mutateAsync(input);
      if (capturedImage && capturedImage.startsWith('data:') && newArticle) {
        const imageUrl = await uploadImage(capturedImage, newArticle.organization_id, newArticle.id);
        if (imageUrl) {
          await updateArticle.mutateAsync({
            id: newArticle.id,
            image_url: imageUrl
          });
        }
      }
    }
    setIsArticleDialogOpen(false);
    setEditingArticle(null);
  };
  const handleArticleDelete = async () => {
    if (deletingArticle) {
      await deleteArticle.mutateAsync(deletingArticle.id);
      setDeletingArticle(null);
    }
  };

  // Debounced search values for performance
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);
  const debouncedArticleSearchQuery = useDebouncedValue(articleSearchQuery, 300);

  // Filtered suppliers - now filter by article categories
  const filteredSuppliers = suppliers?.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) || supplier.email.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

    // Filter by article categories instead of supplier categories
    const supplierArticles = articlesBySupplier[supplier.id] || [];
    const matchesTopCategory = topCategoryFilter === 'all' || supplierArticles.some(a => a.top_category === topCategoryFilter);
    const matchesCategory = categoryFilter === 'all' || supplierArticles.some(a => a.category === categoryFilter);
    return matchesSearch && matchesTopCategory && matchesCategory;
  });

  // Filtered articles (use location-filtered articles as base)
  const filteredArticles = locationFilteredArticles?.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(debouncedArticleSearchQuery.toLowerCase()) || article.description?.toLowerCase().includes(debouncedArticleSearchQuery.toLowerCase());
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
    const groups: {
      supplier: {
        id: string;
        name: string;
      };
      articles: typeof sortedArticles;
    }[] = [];
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
      groups.push({
        supplier: {
          id: supplierId,
          name: supplierName
        },
        articles
      });
    });
    return groups.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name, 'de'));
  }, [sortedArticles]);

  // Track previous search query to detect when search is cleared
  const prevArticleSearchRef = useRef(debouncedArticleSearchQuery);

  // Auto-expand suppliers when article search query is active
  useEffect(() => {
    const prevSearch = prevArticleSearchRef.current;
    prevArticleSearchRef.current = debouncedArticleSearchQuery;
    if (debouncedArticleSearchQuery.trim() !== '') {
      // Search active: open all filtered suppliers
      const supplierIds = groupedBySupplier.map(group => group.supplier.id);
      setOpenArticleSuppliers(new Set(supplierIds));
    } else if (prevSearch.trim() !== '') {
      // Search was just cleared: close all
      setOpenArticleSuppliers(new Set());
    }
    // If search was already empty: do nothing (allow manual toggle)
  }, [debouncedArticleSearchQuery, groupedBySupplier]);
  const articleCategoriesForFilter = (locationFilteredArticles?.map(a => a.category).filter(Boolean) || []) as string[];
  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>;
  }
  const { sidebarCollapsed, toggleSidebar } = useSidebarContext();
  
  return <DashboardLayout>
      <div className="space-y-2 md:space-y-5 xl:space-y-6">
        {/* Header with Breadcrumb */}
        <PageHeader activeTab={activeTab} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="suppliers">{t('nav.suppliers')}</TabsTrigger>
            <TabsTrigger value="wines" className="gap-1">
              <span className="hidden sm:inline">🍷</span> Weine
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="relative">
              Vorschläge
              {(suggestionsCount ?? 0) > 0 && <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {suggestionsCount}
                </span>}
            </TabsTrigger>
          </TabsList>

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-4">
            {/* Combined Filter + Actions Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <SupplierFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} topCategoryFilter={topCategoryFilter} onTopCategoryChange={setTopCategoryFilter} categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter} articleCategories={articleCategoriesForSupplierFilter} multiSelectEnabled={supplierMultiSelectEnabled} onMultiSelectChange={setSupplierMultiSelectEnabled} selectedCount={selectedSuppliers.size} onPrintCombined={handlePrintCombined} showMultiSelectToggle={advancedSettingsEnabled} />
              <div className="flex flex-wrap gap-2 shrink-0">
                {advancedSettingsEnabled && <ExportMenu filename="suppliers" title="Lieferanten" headers={['Name', 'Email', 'Telefon', 'Adresse', 'Ansprechpartner', 'Kundennummer', 'Status']} getData={() => suppliers?.map(s => [s.name, s.email, s.phone || '', s.address || '', s.contact_person || '', getLocationCustomerNumber(s.id) || s.customer_number || '', s.is_active ? 'Aktiv' : 'Inaktiv']) || []} disabled={!suppliers?.length} />}
                {advancedSettingsEnabled && <ExportMenu filename="articles" title="Artikel" headers={['Artikelname', 'SKU', 'Beschreibung', 'Lieferant', 'Kategorie', 'Oberkategorie', 'Einheit', 'VPE', 'Einkaufspreis', 'Verkaufspreis', 'Ref.-Preis', 'Ref.-Einheit', 'Herkunftsland', 'Rebsorte', 'Geschmacksprofil', 'Speiseempfehlung', 'Status']} getData={() => allArticles?.map(a => {
                  const supplier = suppliers?.find(s => s.id === a.supplier_id);
                  return [
                    a.name,
                    a.sku || '',
                    a.description || '',
                    supplier?.name || '',
                    a.category || '',
                    a.top_category || '',
                    a.unit,
                    a.packaging_unit?.toString() || '',
                    a.price.toFixed(2).replace('.', ','),
                    a.selling_price?.toFixed(2).replace('.', ',') || '',
                    a.reference_price?.toFixed(2).replace('.', ',') || '',
                    a.reference_unit || '',
                    a.origin_country || '',
                    a.grape_variety || '',
                    a.flavor_profile || '',
                    a.food_pairings || '',
                    a.is_active ? 'Aktiv' : 'Inaktiv'
                  ];
                }) || []} disabled={!allArticles?.length} />}
                {advancedSettingsEnabled && <Button variant="outline" className="h-10 sm:h-9" onClick={() => setIsSupplierImportOpen(true)}>
                    <Upload className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Importieren</span>
                  </Button>}
                <Button className="h-10 sm:h-9" onClick={handleOpenSupplierDialog}>
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Lieferant hinzufügen</span>
                </Button>
              </div>
            </div>

            {/* Supplier Form Dialog */}
            <SupplierFormDialog open={isSupplierDialogOpen} onOpenChange={open => {
            setIsSupplierDialogOpen(open);
            if (!open) setEditingSupplier(null);
          }} editingSupplier={editingSupplier} onSubmit={handleSupplierSubmit} onImportArticles={supplierId => {
            setArticleImportSupplierId(supplierId);
            setIsSupplierDialogOpen(false);
          }} isPending={createSupplier.isPending || updateSupplier.isPending} />

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

            {/* Suppliers Table */}
            {suppliersLoading ? <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div> : filteredSuppliers?.length === 0 && !searchQuery && topCategoryFilter === 'all' && categoryFilter === 'all' && (!allArticles || allArticles.length === 0) ?
          // Empty catalog onboarding CTA
          <div className="text-center py-16 bg-gradient-to-b from-primary/5 to-background border border-primary/20 rounded-xl">
                <div className="flex flex-col items-center gap-6 max-w-md mx-auto px-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Starte mit einem Foto!</h3>
                    <p className="text-muted-foreground">
                      Fotografiere ein Produkt und die KI erkennt automatisch Name, Kategorie und Einheit. So baust du deinen Katalog in Sekunden auf.
                    </p>
                  </div>
                  <Button size="lg" className="h-14 px-8 text-base" onClick={() => setIsQuickCaptureOpen(true)}>
                    <Package className="w-5 h-5 mr-2" />
                    Schnell-Erfassung starten
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Oder <button className="underline hover:text-foreground" onClick={handleOpenSupplierDialog}>füge manuell einen Lieferanten hinzu</button>
                  </p>
                </div>
              </div> : filteredSuppliers?.length === 0 ? <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">
                  {searchQuery || topCategoryFilter !== 'all' || categoryFilter !== 'all' ? 'Keine Lieferanten gefunden' : 'Noch keine Lieferanten. Fügen Sie Ihren ersten Lieferanten hinzu.'}
                </p>
               </div> : <SupplierTable suppliers={filteredSuppliers || []} articlesBySupplier={articlesBySupplier} expandedSuppliers={expandedSuppliers} selectedSuppliers={selectedSuppliers} multiSelectEnabled={supplierMultiSelectEnabled} pendingChangesBySupplier={pendingChangesBySupplier || {}} pendingArticleIds={pendingArticleIds || new Set()} recentlyActiveSuppliers={recentlyActiveSuppliers || new Map()} advancedSettingsEnabled={advancedSettingsEnabled} onToggleExpand={toggleSupplierExpanded} onToggleSelect={toggleSupplierSelected} onSelectAll={selectAllSuppliers} onEdit={supplier => {
            setEditingSupplier(supplier);
            setIsSupplierDialogOpen(true);
          }} onDelete={setDeletingSupplier} onSendInvitation={handleSendInvitation} onShowQRCode={setQrCodeSupplier} onShowTokens={setTokensDialogSupplier} onOpenPortal={handleOpenPortal} onShowChanges={setChangesDialogSupplier} onShowLocations={setLocationsDialogSupplier} onPrintOrderList={async (supplier, articles) => await generateOrderListPdf(supplier, articles.map(a => ({
            name: a.name,
            unit: a.unit,
            sku: a.sku,
            description: a.description,
            lastOrderQuantity: lastOrderMap?.[a.id]?.quantity,
            lastOrderDate: lastOrderMap?.[a.id]?.date
          })))} onArticleChangeClick={(article, supplier) => {
            setChangesDialogSupplier(supplier);
            setChangesDialogArticle({
              id: article.id,
              name: article.name
            });
          }} onEditArticle={article => {
            setEditingArticle(article);
            setPreselectedSupplierId(null);
            setIsArticleDialogOpen(true);
          }} onDeleteArticle={setDeletingArticle} onAddArticle={supplier => {
            setEditingArticle(null);
            setPreselectedSupplierId(supplier.id);
            setIsArticleDialogOpen(true);
          }} invitingSupplierId={invitingSupplierId} sendingInvitation={sendingInvitation} />}
          </TabsContent>

          {/* Wines Tab */}
          <TabsContent value="wines" className="space-y-4">
            <WinesTab articles={allArticles || []} suppliers={suppliers || []} onEditArticle={article => {
            setEditingArticle(article);
            setIsArticleDialogOpen(true);
          }} />
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <SuggestionsTab suppliers={suppliers || []} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Article Form Dialog - outside Tabs for global availability */}
      <ArticleFormDialog 
        open={isArticleDialogOpen} 
        onOpenChange={open => {
          setIsArticleDialogOpen(open);
          if (!open) {
            setEditingArticle(null);
            setPreselectedSupplierId(null);
          }
        }} 
        editingArticle={editingArticle}
        preselectedSupplierId={preselectedSupplierId}
        suppliers={suppliers || []} 
        categories={allArticleCategories} 
        units={existingUnits} 
        onSubmit={handleArticleSubmit} 
        isPending={createArticle.isPending || updateArticle.isPending}
        onDelete={(article) => {
          setDeletingArticle(article);
          setIsArticleDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialogs deletingSupplier={deletingSupplier} onSupplierClose={() => setDeletingSupplier(null)} onSupplierDelete={handleSupplierDelete} isSupplierDeleting={deleteSupplier.isPending} deletingArticle={deletingArticle} onArticleClose={() => setDeletingArticle(null)} onArticleDelete={handleArticleDelete} isArticleDeleting={deleteArticle.isPending} />

      {/* Supplier Changes Dialog */}
      <SupplierChangesDialog open={!!changesDialogSupplier} onOpenChange={open => {
      if (!open) {
        setChangesDialogSupplier(null);
        setChangesDialogArticle(null);
      }
    }} supplierId={changesDialogSupplier?.id || null} supplierName={changesDialogSupplier?.name || ''} articleId={changesDialogArticle?.id} articleName={changesDialogArticle?.name} />

      {/* Supplier Locations Dialog */}
      {locationsDialogSupplier && <SupplierLocationsDialog open={!!locationsDialogSupplier} onOpenChange={open => !open && setLocationsDialogSupplier(null)} supplier={locationsDialogSupplier} />}

      {/* Upgrade Dialog for Suppliers */}
      <UpgradeDialog open={showSupplierUpgradeDialog} onOpenChange={setShowSupplierUpgradeDialog} limitType="suppliers" currentTier={subscriptionLimits.tier} currentUsage={subscriptionLimits.usage.suppliersCount} limit={subscriptionLimits.limits.suppliers} />

      {/* Quick Capture Wizard */}
      <QuickCaptureWizard open={isQuickCaptureOpen} onOpenChange={setIsQuickCaptureOpen} suppliers={suppliers || []} categories={allArticleCategories} units={existingUnits} onCreateSupplier={async input => {
      const result = await createSupplier.mutateAsync(input);
      return result;
    }} onCreateArticle={async input => {
      const result = await createArticle.mutateAsync(input);
      return result;
    }} onUploadImage={async (base64, orgId, articleId) => {
      const imageUrl = await uploadImage(base64, orgId, articleId);
      if (imageUrl) {
        await updateArticle.mutateAsync({
          id: articleId,
          image_url: imageUrl
        });
      }
      return imageUrl;
    }} organizationId={organizationId} />

      <SupplierQRCodeDialog supplier={qrCodeSupplier} open={!!qrCodeSupplier} onOpenChange={open => !open && setQrCodeSupplier(null)} />
      
      <SupplierTokensDialog 
        open={!!tokensDialogSupplier} 
        onOpenChange={open => !open && setTokensDialogSupplier(null)} 
        supplier={tokensDialogSupplier} 
      />
    </DashboardLayout>;
};
export default Suppliers;