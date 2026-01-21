import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useCart } from '@/contexts/CartContext';
import { useSuppliers, useSuppliersByLocation, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useArticles, Article, ArticleInput } from '@/hooks/useArticles';
import { useArticleLocationsByLocation } from '@/hooks/useArticleLocations';
import { useSupplierLocations } from '@/hooks/useSupplierLocations';
import { useCategories } from '@/hooks/useCategories';
import { useOrderUnits } from '@/hooks/useOrderUnits';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_UNITS } from '@/components/suppliers/constants';
import { 
  SupplierDialogState, 
  ArticleDialogState, 
  DeleteState, 
  ChangesDialogState,
  AddArticleSheetState 
} from './types';

export const useSuppliersPageState = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeLocation } = useLocationContext();
  const { items: cartItems, addItem, updateQuantity } = useCart();

  // Tab state from URL
  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'articles' ? 'suppliers' : (tabParam || 'suppliers');
  
  useEffect(() => {
    if (tabParam === 'articles') {
      setSearchParams({ tab: 'suppliers' }, { replace: true });
    }
  }, [tabParam, setSearchParams]);
  
  const setActiveTab = (tab: string) => setSearchParams({ tab });

  // Supplier filters
  const [searchQuery, setSearchQuery] = useState('');
  const [topCategoryFilter, setTopCategoryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300);

  // Article filters  
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [selectedArticleSuppliers, setSelectedArticleSuppliers] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const debouncedArticleSearchQuery = useDebouncedValue(articleSearchQuery, 300);

  // Expansion/selection states
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [openArticleSuppliers, setOpenArticleSuppliers] = useState<Set<string>>(new Set());

  // Dialog states
  const [supplierDialog, setSupplierDialog] = useState<SupplierDialogState>({ isOpen: false, editingSupplier: null });
  const [articleDialog, setArticleDialog] = useState<ArticleDialogState>({ isOpen: false, editingArticle: null, preselectedSupplierId: null });
  const [deleteState, setDeleteState] = useState<DeleteState>({ deletingSupplier: null, deletingArticle: null });
  const [changesDialog, setChangesDialog] = useState<ChangesDialogState>({ supplier: null, article: null });
  const [locationsDialogSupplier, setLocationsDialogSupplier] = useState<Supplier | null>(null);
  const [addArticleSheet, setAddArticleSheet] = useState<AddArticleSheetState>({ open: false, supplierId: '', supplierName: '' });

  // Import states
  const [isSupplierImportOpen, setIsSupplierImportOpen] = useState(false);
  const [articleImportSupplierId, setArticleImportSupplierId] = useState<string | null>(null);

  // Other dialog states
  const [invitingSupplierId, setInvitingSupplierId] = useState<string | null>(null);
  const [qrCodeSupplier, setQrCodeSupplier] = useState<Supplier | null>(null);
  const [tokensDialogSupplier, setTokensDialogSupplier] = useState<Supplier | null>(null);
  const [isMergeSuppliersOpen, setIsMergeSuppliersOpen] = useState(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [showSupplierUpgradeDialog, setShowSupplierUpgradeDialog] = useState(false);

  // Organization data
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string>('');

  // Local settings
  const [supplierMultiSelectEnabled, setSupplierMultiSelectEnabled] = useState(() => 
    localStorage.getItem('suppliers-multi-select') === 'true'
  );
  const [articleAdvancedViewEnabled, setArticleAdvancedViewEnabled] = useState(() => 
    localStorage.getItem('articles-advanced-view') === 'true'
  );
  const [advancedSettingsEnabled, setAdvancedSettingsEnabled] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  // Persist settings
  useEffect(() => {
    localStorage.setItem('suppliers-multi-select', String(supplierMultiSelectEnabled));
  }, [supplierMultiSelectEnabled]);

  useEffect(() => {
    localStorage.setItem('articles-advanced-view', String(articleAdvancedViewEnabled));
  }, [articleAdvancedViewEnabled]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setAdvancedSettingsEnabled(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Clear selections when multi-select disabled
  useEffect(() => {
    if (!supplierMultiSelectEnabled) setSelectedSuppliers(new Set());
  }, [supplierMultiSelectEnabled]);

  useEffect(() => {
    if (!articleAdvancedViewEnabled) setSelectedArticles(new Set());
  }, [articleAdvancedViewEnabled]);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Fetch org data
  useEffect(() => {
    const fetchOrgData = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
      if (profile?.organization_id) {
        setOrganizationId(profile.organization_id);
        const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.organization_id).single();
        if (org) setOrganizationName(org.name);
      }
    };
    fetchOrgData();
  }, [user]);

  // Data queries
  const { data: allSuppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: locationSuppliers } = useSuppliersByLocation(activeLocation?.id);
  const suppliers = locationSuppliers ?? allSuppliers;
  
  const { data: allArticles, isLoading: articlesLoading } = useArticles();
  const { data: articleLocations } = useArticleLocationsByLocation(activeLocation?.id);
  const { data: supplierLocations } = useSupplierLocations();
  const { data: dbCategories } = useCategories();
  const { data: orderUnits } = useOrderUnits();

  // Location-filtered article IDs
  const locationArticleIds = useMemo(() => {
    if (!articleLocations) return null;
    return new Set(articleLocations.map(al => al.article_id));
  }, [articleLocations]);

  // Location-filtered articles
  const locationFilteredArticles = useMemo(() => {
    if (!allArticles) return [];
    if (!locationArticleIds) return allArticles;
    return allArticles.filter(article => locationArticleIds.has(article.id));
  }, [allArticles, locationArticleIds]);

  // Articles grouped by supplier
  const articlesBySupplier = useMemo(() => 
    locationFilteredArticles?.reduce((acc, article) => {
      if (!acc[article.supplier_id]) acc[article.supplier_id] = [];
      acc[article.supplier_id].push(article);
      return acc;
    }, {} as Record<string, Article[]>) || {},
  [locationFilteredArticles]);

  // Categories
  const allArticleCategories = useMemo(() => {
    const articleDerivedCategories = locationFilteredArticles?.map(a => a.category).filter(Boolean) as string[] || [];
    const dbCategoryNames = dbCategories?.map(c => c.name) || [];
    return [...new Set([...articleDerivedCategories, ...dbCategoryNames])].sort();
  }, [locationFilteredArticles, dbCategories]);

  const articleCategoriesForSupplierFilter = useMemo(() => 
    [...new Set(locationFilteredArticles?.map(a => a.category).filter(Boolean) as string[])].sort(),
  [locationFilteredArticles]);

  // Units
  const existingUnits = useMemo(() => 
    [...new Set([...DEFAULT_UNITS, ...(locationFilteredArticles?.map(a => a.unit).filter(Boolean) as string[] || [])])].sort(),
  [locationFilteredArticles]);

  // Cart calculations
  const cartItemCountsBySupplier = useMemo(() => {
    const counts: Record<string, number> = {};
    cartItems.forEach(item => {
      const supplierId = item.article.supplier_id;
      counts[supplierId] = (counts[supplierId] || 0) + item.quantity;
    });
    return counts;
  }, [cartItems]);

  const cartItemsByArticle = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach(item => map.set(item.article.id, item.quantity));
    return map;
  }, [cartItems]);

  // Cart handlers
  const handleAddToCart = useCallback((article: Article) => addItem(article, 1), [addItem]);
  
  const handleRemoveFromCart = useCallback((article: Article) => {
    const currentQty = cartItemsByArticle.get(article.id) || 0;
    updateQuantity(article.id, currentQty > 1 ? currentQty - 1 : 0);
  }, [cartItemsByArticle, updateQuantity]);

  // Location customer number helper
  const getLocationCustomerNumber = useCallback((supplierId: string) => {
    if (!activeLocation || !supplierLocations) return null;
    const locationLink = supplierLocations.find(
      sl => sl.supplier_id === supplierId && sl.location_id === activeLocation.id
    );
    return locationLink?.customer_number || null;
  }, [activeLocation, supplierLocations]);

  // Toggle handlers
  const toggleSupplierExpanded = useCallback((supplierId: string) => {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      next.has(supplierId) ? next.delete(supplierId) : next.add(supplierId);
      return next;
    });
  }, []);

  const toggleSupplierSelected = useCallback((supplierId: string) => {
    setSelectedSuppliers(prev => {
      const next = new Set(prev);
      next.has(supplierId) ? next.delete(supplierId) : next.add(supplierId);
      return next;
    });
  }, []);

  const toggleArticleSupplier = useCallback((supplierId: string) => {
    setOpenArticleSuppliers(prev => {
      const next = new Set(prev);
      next.has(supplierId) ? next.delete(supplierId) : next.add(supplierId);
      return next;
    });
  }, []);

  const toggleArticleSelected = useCallback((articleId: string) => {
    setSelectedArticles(prev => {
      const next = new Set(prev);
      next.has(articleId) ? next.delete(articleId) : next.add(articleId);
      return next;
    });
  }, []);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => suppliers?.filter(supplier => {
    const supplierArticles = articlesBySupplier[supplier.id] || [];
    
    const matchesArticleSearch = debouncedSearchQuery === '' || 
      supplierArticles.some(article => 
        article.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        article.sku?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    const matchesSupplierName = supplier.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    const matchesSearch = matchesArticleSearch || matchesSupplierName;

    const matchesTopCategory = topCategoryFilter === 'all' || supplierArticles.some(a => a.top_category === topCategoryFilter);
    const matchesCategory = categoryFilter === 'all' || supplierArticles.some(a => a.category === categoryFilter);
    
    return matchesSearch && matchesTopCategory && matchesCategory;
  }), [suppliers, articlesBySupplier, debouncedSearchQuery, topCategoryFilter, categoryFilter]);

  // Filtered articles
  const filteredArticles = useMemo(() => locationFilteredArticles?.filter(article => {
    const matchesSearch = article.name.toLowerCase().includes(debouncedArticleSearchQuery.toLowerCase()) || 
      article.description?.toLowerCase().includes(debouncedArticleSearchQuery.toLowerCase());
    const matchesSupplier = selectedArticleSuppliers.length === 0 || selectedArticleSuppliers.includes(article.supplier_id);
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesSupplier && matchesCategory;
  }), [locationFilteredArticles, debouncedArticleSearchQuery, selectedArticleSuppliers, selectedCategory]);

  // Sorted articles
  const sortedArticles = useMemo(() => filteredArticles?.slice().sort((a, b) => {
    const supplierA = suppliers?.find(s => s.id === a.supplier_id)?.name || '';
    const supplierB = suppliers?.find(s => s.id === b.supplier_id)?.name || '';
    const supplierCompare = supplierA.localeCompare(supplierB, 'de');
    if (supplierCompare !== 0) return supplierCompare;
    return a.name.localeCompare(b.name, 'de');
  }), [filteredArticles, suppliers]);

  // Grouped by supplier
  const groupedBySupplier = useMemo(() => {
    const groups: { supplier: { id: string; name: string }; articles: typeof sortedArticles }[] = [];
    const groupMap = new Map<string, typeof sortedArticles>();
    
    sortedArticles?.forEach(article => {
      const supplierId = article.supplier_id;
      if (!groupMap.has(supplierId)) groupMap.set(supplierId, []);
      groupMap.get(supplierId)!.push(article);
    });
    
    groupMap.forEach((articles, supplierId) => {
      const supplierName = articles[0]?.suppliers?.name || 'Unbekannt';
      groups.push({ supplier: { id: supplierId, name: supplierName }, articles });
    });
    
    return groups.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name, 'de'));
  }, [sortedArticles]);

  // Auto-expand on search
  const prevArticleSearchRef = useRef(debouncedArticleSearchQuery);
  const prevSupplierSearchRef = useRef(debouncedSearchQuery);

  useEffect(() => {
    const prevSearch = prevArticleSearchRef.current;
    prevArticleSearchRef.current = debouncedArticleSearchQuery;
    
    if (debouncedArticleSearchQuery.trim() !== '') {
      const supplierIds = groupedBySupplier.map(group => group.supplier.id);
      setOpenArticleSuppliers(new Set(supplierIds));
    } else if (prevSearch.trim() !== '') {
      setOpenArticleSuppliers(new Set());
    }
  }, [debouncedArticleSearchQuery, groupedBySupplier]);

  useEffect(() => {
    const prevSearch = prevSupplierSearchRef.current;
    prevSupplierSearchRef.current = debouncedSearchQuery;
    
    if (debouncedSearchQuery.trim() !== '') {
      const matchingSupplierIds = filteredSuppliers
        ?.filter(supplier => {
          const supplierArticles = articlesBySupplier[supplier.id] || [];
          return supplierArticles.some(article =>
            article.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            article.sku?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
          );
        })
        .map(s => s.id) || [];
      setExpandedSuppliers(new Set(matchingSupplierIds));
    } else if (prevSearch.trim() !== '') {
      setExpandedSuppliers(new Set());
    }
  }, [debouncedSearchQuery, filteredSuppliers, articlesBySupplier]);

  return {
    // Auth
    user,
    authLoading,
    
    // Tabs
    activeTab,
    setActiveTab,
    
    // Supplier filters
    searchQuery,
    setSearchQuery,
    topCategoryFilter,
    setTopCategoryFilter,
    categoryFilter,
    setCategoryFilter,
    debouncedSearchQuery,
    
    // Article filters
    articleSearchQuery,
    setArticleSearchQuery,
    selectedArticleSuppliers,
    setSelectedArticleSuppliers,
    selectedCategory,
    setSelectedCategory,
    
    // Selection/expansion
    expandedSuppliers,
    setExpandedSuppliers,
    selectedSuppliers,
    setSelectedSuppliers,
    selectedArticles,
    setSelectedArticles,
    openArticleSuppliers,
    
    // Dialogs
    supplierDialog,
    setSupplierDialog,
    articleDialog,
    setArticleDialog,
    deleteState,
    setDeleteState,
    changesDialog,
    setChangesDialog,
    locationsDialogSupplier,
    setLocationsDialogSupplier,
    addArticleSheet,
    setAddArticleSheet,
    
    // Import
    isSupplierImportOpen,
    setIsSupplierImportOpen,
    articleImportSupplierId,
    setArticleImportSupplierId,
    
    // Other dialogs
    invitingSupplierId,
    setInvitingSupplierId,
    qrCodeSupplier,
    setQrCodeSupplier,
    tokensDialogSupplier,
    setTokensDialogSupplier,
    isMergeSuppliersOpen,
    setIsMergeSuppliersOpen,
    isQuickCaptureOpen,
    setIsQuickCaptureOpen,
    showSupplierUpgradeDialog,
    setShowSupplierUpgradeDialog,
    
    // Organization
    organizationId,
    organizationName,
    
    // Settings
    supplierMultiSelectEnabled,
    setSupplierMultiSelectEnabled,
    articleAdvancedViewEnabled,
    setArticleAdvancedViewEnabled,
    advancedSettingsEnabled,
    
    // Data
    suppliers,
    suppliersLoading,
    allArticles,
    articlesLoading,
    locationFilteredArticles,
    articlesBySupplier,
    allArticleCategories,
    articleCategoriesForSupplierFilter,
    existingUnits,
    orderUnits,
    supplierLocations,
    
    // Filtered/grouped
    filteredSuppliers,
    filteredArticles,
    sortedArticles,
    groupedBySupplier,
    
    // Cart
    cartItemCountsBySupplier,
    cartItemsByArticle,
    handleAddToCart,
    handleRemoveFromCart,
    
    // Helpers
    getLocationCustomerNumber,
    
    // Toggles
    toggleSupplierExpanded,
    toggleSupplierSelected,
    toggleArticleSupplier,
    toggleArticleSelected,
  };
};
