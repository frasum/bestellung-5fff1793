import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { 
  Article, 
  Location, 
  Supplier, 
  TokenData, 
  Category, 
  Draft, 
  CompletedOrder, 
  OrderStatus 
} from '../types';
import { FreeItem } from '../FreeItemDialog';

interface UseSimpleOrderStateProps {
  token: string | undefined;
}

export const useSimpleOrderState = ({ token }: UseSimpleOrderStateProps) => {
  const { i18n } = useTranslation();
  
  // Core state
  const [status, setStatus] = useState<OrderStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  
  // Employee state
  const [employeeName, setEmployeeName] = useState('');
  const [isEmployeeNameLocked, setIsEmployeeNameLocked] = useState(false);
  const [hasEmployee, setHasEmployee] = useState(false);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  
  // Location & delivery state
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ name?: boolean; location?: boolean; deliveryDate?: boolean }>({});
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [timeWindow, setTimeWindow] = useState<string>('flexible');
  
  // Favorites & auto-approve
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isAutoApproved, setIsAutoApproved] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  
  // Free items
  const [freeItems, setFreeItems] = useState<FreeItem[]>([]);
  
  // Order history
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Photo capture
  const [articlesWithoutPhotos, setArticlesWithoutPhotos] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Verify token and load articles
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('ไม่มีโทเค็น / Kein Token');
        setStatus('error');
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('verify-simple-order-token', {
          body: { token },
        });

        if (fetchError || data?.error) {
          setError(data?.error || fetchError?.message || 'Token ไม่ถูกต้อง / Ungültiger Token');
          setStatus('error');
          return;
        }

        console.log('[SimpleOrder] Token verification response:', {
          can_capture_photos: data.tokenData?.can_capture_photos,
          can_add_free_items: data.tokenData?.can_add_free_items,
          has_employee: data.tokenData?.has_employee,
          employee_name: data.tokenData?.employee_name,
          full_tokenData: data.tokenData,
        });
        
        setTokenData(data.tokenData);
        setAllArticles(data.articles || []);
        setLocations(data.locations || []);
        setHasEmployee(data.tokenData?.has_employee || false);
        
        if (data.articles_without_photos) {
          setArticlesWithoutPhotos(data.articles_without_photos);
        }
        if (data.categories) {
          setCategories(data.categories);
        }
        
        if (data.favorite_article_ids?.length > 0) {
          setFavoriteIds(new Set(data.favorite_article_ids));
        }
        
        if (data.tokenData?.is_multi_supplier && data.suppliers) {
          setSuppliers(data.suppliers);
          setArticles([]);
        } else {
          setArticles(data.articles || []);
          if (data.tokenData?.supplier) {
            setSelectedSupplierId(data.tokenData.supplier.id);
          }
        }
        
        if (data.tokenData?.language) {
          i18n.changeLanguage(data.tokenData.language);
        }
        
        if (data.tokenData?.employee_name) {
          setEmployeeName(data.tokenData.employee_name);
          setIsEmployeeNameLocked(true);
        }
        
        if (data.tokenData?.location?.id) {
          setSelectedLocationId(data.tokenData.location.id);
          setIsLocationLocked(true);
        } else if (data.locations?.length === 1) {
          setSelectedLocationId(data.locations[0].id);
        }
        
        const requiresPinFlag = !!data.tokenData?.requires_pin;
        const wineAccess = data.tokenData?.wine_catalog_access;
        const suppliersLength = data.suppliers?.length ?? 0;
        const supplierObj = data.tokenData?.supplier;
        const isMultiSupplier = !!data.tokenData?.is_multi_supplier;

        console.log('[SimpleOrder] Status decision:', {
          requires_pin: requiresPinFlag,
          wine_catalog_access: wineAccess,
          suppliers_length: suppliersLength,
          supplier: supplierObj,
          supplier_id: supplierObj?.id,
          is_multi_supplier: isMultiSupplier,
        });

        if (requiresPinFlag) {
          setRequiresPin(true);
          setStatus('pin-entry');
        } else if (
          wineAccess &&
          wineAccess !== 'none' &&
          suppliersLength === 0 &&
          (!supplierObj || !supplierObj.id)
        ) {
          console.log('[SimpleOrder] Wine catalog only mode detected');
          setStatus('wine-catalog');
        } else if (isMultiSupplier) {
          setStatus('location-date');
        } else {
          setStatus('ready');
        }
      } catch (err) {
        console.error('Error verifying token:', err);
        setError('เกิดข้อผิดพลาด / Fehler aufgetreten');
        setStatus('error');
      }
    };

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Filter articles when supplier is selected
  useEffect(() => {
    if (selectedSupplierId && tokenData?.is_multi_supplier) {
      const filtered = allArticles.filter(a => a.supplier_id === selectedSupplierId);
      setArticles(filtered);
    }
  }, [selectedSupplierId, allArticles, tokenData?.is_multi_supplier]);

  // Calculate cart count per supplier
  const getCartCountBySupplier = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(quantities).forEach(([articleId, qty]) => {
      if (qty > 0) {
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
          counts[article.supplier_id] = (counts[article.supplier_id] || 0) + qty;
        }
      }
    });
    freeItems.forEach(item => {
      counts[item.supplier_id] = (counts[item.supplier_id] || 0) + item.quantity;
    });
    return counts;
  }, [quantities, allArticles, freeItems]);

  const getTotalItems = () => {
    const articleItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    const freeItemsCount = freeItems.reduce((sum, item) => sum + item.quantity, 0);
    return articleItems + freeItemsCount;
  };

  const getSupplierCartCount = (supplierId: string) => {
    return getCartCountBySupplier[supplierId] || 0;
  };

  const getSupplierArticleCount = (supplierId: string) => {
    return allArticles.filter(a => a.supplier_id === supplierId).length;
  };

  const getCurrentSupplierName = () => {
    if (!tokenData?.is_multi_supplier) {
      return tokenData?.supplier?.name || '';
    }
    if (selectedSupplierId) {
      return suppliers.find(s => s.id === selectedSupplierId)?.name || '';
    }
    return '';
  };

  const getSelectedLocationName = () => {
    const location = locations.find(l => l.id === selectedLocationId);
    return location?.short_code || location?.name || '';
  };

  return {
    // Core state
    status, setStatus,
    error, setError,
    tokenData,
    articles, setArticles,
    allArticles,
    locations,
    suppliers,
    quantities, setQuantities,
    search, setSearch,
    
    // Employee state
    employeeName, setEmployeeName,
    isEmployeeNameLocked,
    hasEmployee,
    requiresPin,
    pinVerified, setPinVerified,
    
    // Location & delivery
    selectedLocationId, setSelectedLocationId,
    isLocationLocked,
    selectedSupplierId, setSelectedSupplierId,
    validationErrors, setValidationErrors,
    deliveryDate, setDeliveryDate,
    timeWindow, setTimeWindow,
    
    // Favorites & auto-approve
    favoriteIds, setFavoriteIds,
    isAutoApproved, setIsAutoApproved,
    orderNumber, setOrderNumber,
    
    // Free items
    freeItems, setFreeItems,
    
    // Order history
    drafts, setDrafts,
    completedOrders, setCompletedOrders,
    isLoadingDrafts, setIsLoadingDrafts,
    isDeletingDraft, setIsDeletingDraft,
    editingDraft, setEditingDraft,
    isSavingDraft, setIsSavingDraft,
    
    // Photo capture
    articlesWithoutPhotos, setArticlesWithoutPhotos,
    categories,
    
    // Computed values
    getTotalItems,
    getSupplierCartCount,
    getSupplierArticleCount,
    getCurrentSupplierName,
    getSelectedLocationName,
  };
};
