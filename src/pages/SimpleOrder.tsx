import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Extracted components
import { SimpleOrderHeader } from '@/components/simple-order/SimpleOrderHeader';
import { EmployeeInfoSection } from '@/components/simple-order/EmployeeInfoSection';
import { SupplierSelection } from '@/components/simple-order/SupplierSelection';
import { ArticleList } from '@/components/simple-order/ArticleList';
import { SubmitBar } from '@/components/simple-order/SubmitBar';
import { DeliveryInfoBar } from '@/components/simple-order/DeliveryInfoBar';
import { LoadingScreen, ErrorScreen, SuccessScreen } from '@/components/simple-order/StatusScreens';
import { EmployeeOrderHistory } from '@/components/simple-order/EmployeeOrderHistory';
import { EmployeeOrderEdit } from '@/components/simple-order/EmployeeOrderEdit';
import { OrderConfirmationScreen } from '@/components/simple-order/OrderConfirmationScreen';
import { PinEntryScreen } from '@/components/simple-order/PinEntryScreen';
import { LocationDateStep } from '@/components/simple-order/LocationDateStep';
import { MultiSupplierCartOverview } from '@/components/simple-order/MultiSupplierCartOverview';
import { VoiceOrderMode } from '@/components/simple-order/VoiceOrderMode';
import { FreeItem } from '@/components/simple-order/FreeItemDialog';
import { PhotoCaptureTab } from '@/components/simple-order/PhotoCaptureTab';
import { WineCatalogView } from '@/components/simple-order/WineCatalogView';

interface Article {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string | null;
  sku: string | null;
  packaging_unit: number | null;
  supplier_id: string;
  sort_order?: number;
  order_unit?: {
    id: string;
    name: string;
    quantity: number;
  } | null;
}

interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

interface Supplier {
  id: string;
  name: string;
  sort_order?: number;
}

interface TokenData {
  id: string;
  label: string;
  language: string;
  is_multi_supplier: boolean;
  employee_name: string | null;
  has_employee: boolean;
  auto_approve_orders: boolean;
  requires_pin: boolean;
  voice_input_enabled: boolean;
  can_add_free_items: boolean;
  can_capture_photos: boolean;
  wine_catalog_access: 'none' | 'view' | 'edit';
  supplier: {
    id: string;
    name: string;
  } | null;
  location: {
    id: string;
    name: string;
  } | null;
  organization_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface DraftItem {
  id: string;
  quantity: number;
  article: {
    id: string;
    name: string;
    unit: string;
    price: number;
    supplier_id: string;
    supplier: {
      id: string;
      name: string;
    };
  };
}

interface Draft {
  id: string;
  name: string;
  notes: string | null;
  location_id: string | null;
  desired_delivery_date: string | null;
  desired_time_window: string | null;
  created_at: string;
  updated_at: string;
  location: {
    id: string;
    name: string;
    short_code: string | null;
  } | null;
  items: DraftItem[];
}

interface CompletedOrderItem {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface CompletedOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  notes: string | null;
  created_at: string;
  location_id: string | null;
  location: {
    id: string;
    name: string;
    short_code: string | null;
  } | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  items: CompletedOrderItem[];
}

type OrderStatus = 'loading' | 'pin-entry' | 'location-date' | 'ready' | 'confirming' | 'submitting' | 'success' | 'error' | 'viewing-history' | 'editing' | 'voice-mode' | 'photo-capture' | 'wine-catalog';

const SimpleOrder = () => {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  
  const [status, setStatus] = useState<OrderStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [isEmployeeNameLocked, setIsEmployeeNameLocked] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ name?: boolean; location?: boolean; deliveryDate?: boolean }>({});
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [timeWindow, setTimeWindow] = useState<string>('flexible');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hasEmployee, setHasEmployee] = useState(false);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  
  // Auto-approve response data
  const [isAutoApproved, setIsAutoApproved] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  
  // Free items state
  const [freeItems, setFreeItems] = useState<FreeItem[]>([]);
  
  // Order history states
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isDeletingDraft, setIsDeletingDraft] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  
  // Photo capture state
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

        // DEBUG: Log full token response
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
        
        // Load photo capture data
        if (data.articles_without_photos) {
          setArticlesWithoutPhotos(data.articles_without_photos);
        }
        if (data.categories) {
          setCategories(data.categories);
        }
        
        // Load favorites from response
        if (data.favorite_article_ids?.length > 0) {
          setFavoriteIds(new Set(data.favorite_article_ids));
        }
        
        // Handle multi-supplier tokens
        if (data.tokenData?.is_multi_supplier && data.suppliers) {
          setSuppliers(data.suppliers);
          setArticles([]);
        } else {
          setArticles(data.articles || []);
          if (data.tokenData?.supplier) {
            setSelectedSupplierId(data.tokenData.supplier.id);
          }
        }
        
        // Set language from token
        if (data.tokenData?.language) {
          i18n.changeLanguage(data.tokenData.language);
        }
        
        // Pre-fill employee name if set on token
        if (data.tokenData?.employee_name) {
          setEmployeeName(data.tokenData.employee_name);
          setIsEmployeeNameLocked(true);
        }
        
        // Pre-select location from token if set, otherwise from single location
        if (data.tokenData?.location?.id) {
          setSelectedLocationId(data.tokenData.location.id);
          setIsLocationLocked(true);
        } else if (data.locations?.length === 1) {
          setSelectedLocationId(data.locations[0].id);
        }
        
        // Check if PIN is required
        if (data.tokenData?.requires_pin) {
          setRequiresPin(true);
          setStatus('pin-entry');
        } else if (
          data.tokenData?.wine_catalog_access && 
          data.tokenData?.wine_catalog_access !== 'none' && 
          (!data.suppliers || data.suppliers.length === 0) && 
          (!data.tokenData?.supplier || !data.tokenData?.supplier?.id)
        ) {
          // Wine catalog only mode: no suppliers but has wine access
          console.log('[SimpleOrder] Wine catalog only mode detected:', {
            wine_catalog_access: data.tokenData?.wine_catalog_access,
            suppliers_length: data.suppliers?.length,
            tokenData_supplier: data.tokenData?.supplier,
            tokenData_supplier_id: data.tokenData?.supplier?.id,
          });
          setStatus('wine-catalog');
        } else if (data.tokenData?.is_multi_supplier) {
          // Multi-supplier: Start with location/date step
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

  // Calculate cart count per supplier (including free items)
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
    // Add free items
    freeItems.forEach(item => {
      counts[item.supplier_id] = (counts[item.supplier_id] || 0) + item.quantity;
    });
    return counts;
  }, [quantities, allArticles, freeItems]);

  const getSupplierCartCount = (supplierId: string) => {
    return getCartCountBySupplier[supplierId] || 0;
  };

  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    // DO NOT clear quantities - persist across supplier switches
    setSearch('');
  };

  const handleBackToSuppliers = () => {
    setSelectedSupplierId(null);
    // DO NOT clear quantities - persist across supplier switches
    setSearch('');
  };

  const handleQuantityChange = (articleId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[articleId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [articleId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [articleId]: newValue };
    });
  };

  const toggleFavorite = async (articleId: string) => {
    const isFavorite = favoriteIds.has(articleId);
    const action = isFavorite ? 'remove' : 'add';
    
    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });

    // Only persist if employee is assigned
    if (hasEmployee && token) {
      try {
        const { data, error } = await supabase.functions.invoke('manage-simple-order-favorites', {
          body: { token, article_id: articleId, action },
        });
        
        if (error || data?.error) {
          console.error('Error toggling favorite:', error || data?.error);
          // Revert optimistic update on error
          setFavoriteIds(prev => {
            const next = new Set(prev);
            if (isFavorite) {
              next.add(articleId);
            } else {
              next.delete(articleId);
            }
            return next;
          });
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    }
  };

  const getTotalItems = () => {
    const articleItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    const freeItemsCount = freeItems.reduce((sum, item) => sum + item.quantity, 0);
    return articleItems + freeItemsCount;
  };

  // Free item handlers
  const handleAddFreeItem = (item: Omit<FreeItem, 'id'>) => {
    const newItem: FreeItem = {
      ...item,
      id: `free-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setFreeItems(prev => [...prev, newItem]);
  };

  const handleUpdateFreeItem = (updatedItem: FreeItem) => {
    setFreeItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
  };

  const handleDeleteFreeItem = (itemId: string) => {
    setFreeItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleFreeItemQuantityChange = (itemId: string, delta: number) => {
    setFreeItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const validateForm = (): boolean => {
    const errors: { name?: boolean; location?: boolean; deliveryDate?: boolean } = {};
    
    if (!isEmployeeNameLocked && !employeeName.trim()) {
      errors.name = true;
    }
    if (!selectedLocationId) {
      errors.location = true;
    }
    if (!deliveryDate) {
      errors.deliveryDate = true;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle submit button click - either go to confirmation or submit directly
  const handleSubmitClick = () => {
    if (getTotalItems() === 0) return;
    if (!validateForm()) return;

    // Multi-supplier tokens OR auto-approve employees: show confirmation screen first
    if (tokenData?.is_multi_supplier || tokenData?.auto_approve_orders) {
      setStatus('confirming');
    } else {
      // Single-supplier without auto-approve: submit directly as pre-order
      handleSubmit();
    }
  };

  // Navigate directly to cart overview without validation (for floating button)
  const handleViewCartFromSupplierSelection = () => {
    if (getTotalItems() === 0) return;
    setStatus('confirming');
  };

  // Submit orders for all suppliers with items in cart
  const handleSubmit = async () => {
    if (getTotalItems() === 0) return;
    if (!validateForm()) return;

    setStatus('submitting');

    // Group items by supplier
    const itemsBySupplier: Record<string, { article_id: string; article_name: string; quantity: number }[]> = {};
    Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .forEach(([articleId, quantity]) => {
        const article = allArticles.find(a => a.id === articleId);
        if (article) {
          if (!itemsBySupplier[article.supplier_id]) {
            itemsBySupplier[article.supplier_id] = [];
          }
          itemsBySupplier[article.supplier_id].push({
            article_id: articleId,
            article_name: article.name,
            quantity,
          });
        }
      });

    // Group free items by supplier
    const freeItemsBySupplier: Record<string, { name: string; quantity: number; unit: string; supplier_id: string }[]> = {};
    freeItems.forEach(item => {
      if (!freeItemsBySupplier[item.supplier_id]) {
        freeItemsBySupplier[item.supplier_id] = [];
      }
      freeItemsBySupplier[item.supplier_id].push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        supplier_id: item.supplier_id,
      });
    });

    // Debug logging for free items
    console.log('🟡 Free items state:', freeItems);
    console.log('🟡 Free items by supplier:', freeItemsBySupplier);

    // Get all supplier IDs that have items (regular or free)
    const allSupplierIds = new Set([
      ...Object.keys(itemsBySupplier),
      ...Object.keys(freeItemsBySupplier),
    ]);
    const supplierIds = Array.from(allSupplierIds);
    console.log('🟡 Supplier IDs to submit:', supplierIds);
    
    try {
      // Submit orders for each supplier
      const results = await Promise.all(
        supplierIds.map(async (supplierId) => {
          const items = itemsBySupplier[supplierId] || [];
          const freeItemsForSupplier = freeItemsBySupplier[supplierId] || [];
          
          console.log(`📦 Sending to supplier ${supplierId}:`, {
            regularItems: items.length,
            freeItems: freeItemsForSupplier.length,
            freeItemsData: freeItemsForSupplier
          });
          
          const { data, error: submitError } = await supabase.functions.invoke('submit-simple-order', {
            body: { 
              token, 
              items,
              free_items: freeItemsForSupplier,
              employee_name: employeeName.trim(),
              location_id: selectedLocationId,
              supplier_id: supplierId,
              delivery_date: deliveryDate?.toISOString().split('T')[0] || null,
              time_window: timeWindow || null,
            },
          });
          return { supplierId, data, error: submitError };
        })
      );

      // Log results for debugging
      console.log('Submit results:', results.map(r => ({
        supplierId: r.supplierId,
        success: r.data?.success,
        error: r.error?.message,
        dataError: r.data?.error,
      })));

      // Check for errors - only fail if there's a real error, not just missing success flag
      const errors = results.filter(r => {
        // Network/SDK error from supabase.functions.invoke
        if (r.error) return true;
        // Response has explicit error property
        if (r.data?.error) return true;
        // Response explicitly indicates failure
        if (r.data && r.data.success === false) return true;
        return false;
      });
      
      if (errors.length > 0) {
        console.error('Errors submitting orders:', errors);
        setError(errors[0].data?.error || errors[0].error?.message || 'Unbekannter Fehler');
        setStatus('error');
        return;
      }

      // Handle auto-approve response (use first order's data)
      const firstResult = results[0];
      if (firstResult?.data?.auto_approved) {
        setIsAutoApproved(true);
        // Collect all order numbers
        const orderNumbers = results.map(r => r.data?.order_number).filter(Boolean);
        setOrderNumber(orderNumbers.join(', ') || null);
      } else {
        setIsAutoApproved(false);
        setOrderNumber(null);
      }

      setStatus('success');
      setQuantities({});
      setFreeItems([]);
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('เกิดข้อผิดพลาดในการส่ง / Fehler beim Senden');
      setStatus('error');
    }
  };

  // Handle quantity change in confirmation screen (remove item if quantity becomes 0)
  const handleConfirmationQuantityChange = (articleId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[articleId] || 0;
      const newValue = Math.max(1, current + delta); // Minimum 1 in confirmation
      return { ...prev, [articleId]: newValue };
    });
  };

  // Remove item from order in confirmation screen
  const handleRemoveItem = (articleId: string) => {
    setQuantities(prev => {
      const { [articleId]: _, ...rest } = prev;
      return rest;
    });
    // If no items left, go back to article list
    if (Object.keys(quantities).length <= 1) {
      setStatus('ready');
    }
  };

  // Fetch employee drafts and completed orders
  const fetchDrafts = async () => {
    if (!token || !hasEmployee) return;
    
    setIsLoadingDrafts(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-employee-drafts', {
        body: { token },
      });

      if (error || data?.error) {
        console.error('Error fetching drafts:', error || data?.error);
        toast.error('Fehler beim Laden der Bestellungen');
      } else {
        setDrafts(data.drafts || []);
        setCompletedOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // View order history
  const handleViewOrders = async () => {
    setStatus('viewing-history');
    await fetchDrafts();
  };

  // Edit a draft
  const handleEditDraft = (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      // Get supplier_id from the first item
      const supplierId = draft.items[0]?.article?.supplier_id;
      if (supplierId) {
        // Filter articles for this supplier
        const supplierArticles = allArticles.filter(a => a.supplier_id === supplierId);
        setArticles(supplierArticles);
        setSelectedSupplierId(supplierId);
      }
      setEditingDraft(draft);
      setStatus('editing');
    }
  };

  // Save edited draft
  const handleSaveDraft = async (
    items: { article_id: string; quantity: number }[],
    newDeliveryDate: Date | undefined,
    newTimeWindow: string
  ) => {
    if (!editingDraft || !token) return;
    
    setIsSavingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-employee-draft', {
        body: {
          token,
          draft_id: editingDraft.id,
          items,
          delivery_date: newDeliveryDate?.toISOString().split('T')[0] || null,
          time_window: newTimeWindow || null,
        },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Fehler beim Speichern');
      } else {
        toast.success(t('simpleOrder.orderUpdated'));
        setEditingDraft(null);
        setStatus('viewing-history');
        await fetchDrafts();
      }
    } catch (err) {
      console.error('Error saving draft:', err);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Delete a draft
  const handleDeleteDraft = async (draftId: string) => {
    if (!token) return;
    
    setIsDeletingDraft(draftId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-employee-draft', {
        body: { token, draft_id: draftId },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Fehler beim Löschen');
      } else {
        toast.success(t('simpleOrder.orderDeleted'));
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        // If we were editing this draft, go back to history
        if (editingDraft?.id === draftId) {
          setEditingDraft(null);
          setStatus('viewing-history');
        }
      }
    } catch (err) {
      console.error('Error deleting draft:', err);
      toast.error('Fehler beim Löschen');
    } finally {
      setIsDeletingDraft(null);
    }
  };

  // Helper functions
  const getCurrentSupplierName = () => {
    if (!tokenData?.is_multi_supplier) {
      return tokenData?.supplier?.name || '';
    }
    if (selectedSupplierId) {
      return suppliers.find(s => s.id === selectedSupplierId)?.name || '';
    }
    return '';
  };

  const getSupplierArticleCount = (supplierId: string) => {
    return allArticles.filter(a => a.supplier_id === supplierId).length;
  };

  const getSelectedLocationName = () => {
    const location = locations.find(l => l.id === selectedLocationId);
    return location?.short_code || location?.name || '';
  };

  // PIN verification handler
  const handlePinVerify = async (pin: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-employee-pin', {
        body: { token, pin },
      });
      
      if (error || data?.error) {
        console.error('PIN verification error:', error || data?.error);
        return false;
      }
      
      return data?.valid === true;
    } catch (err) {
      console.error('Error verifying PIN:', err);
      return false;
    }
  };

  const handlePinSuccess = () => {
    setPinVerified(true);
    // Multi-supplier: go to location/date step after PIN
    if (tokenData?.is_multi_supplier) {
      setStatus('location-date');
    } else {
      setStatus('ready');
    }
  };

  // Handle continue from location/date step
  const handleLocationDateContinue = () => {
    setStatus('ready');
  };

  // Status screens
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'pin-entry') {
    return (
      <PinEntryScreen
        employeeName={employeeName}
        onVerify={handlePinVerify}
        onSuccess={handlePinSuccess}
      />
    );
  }

  if (status === 'error') {
    return <ErrorScreen error={error} />;
  }

  // Location and Date Step for multi-supplier tokens
  if (status === 'location-date') {
    return (
      <LocationDateStep
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationSelect={setSelectedLocationId}
        isLocationLocked={isLocationLocked}
        deliveryDate={deliveryDate}
        onDeliveryDateChange={setDeliveryDate}
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        onContinue={handleLocationDateContinue}
        employeeName={isEmployeeNameLocked ? employeeName : undefined}
      />
    );
  }

  if (status === 'success') {
    return (
      <SuccessScreen 
        onNewOrder={() => {
          setStatus('ready');
          setIsAutoApproved(false);
          setOrderNumber(null);
          if (!isEmployeeNameLocked) {
            setEmployeeName('');
          }
        }}
        onViewOrders={hasEmployee ? handleViewOrders : undefined}
        hasEmployee={hasEmployee}
        isAutoApproved={isAutoApproved}
        orderNumber={orderNumber}
      />
    );
  }

  if (status === 'viewing-history') {
    return (
      <EmployeeOrderHistory
        drafts={drafts}
        orders={completedOrders}
        isLoading={isLoadingDrafts}
        employeeName={employeeName}
        onEdit={handleEditDraft}
        onDelete={handleDeleteDraft}
        onBack={() => setStatus('ready')}
        isDeleting={isDeletingDraft}
      />
    );
  }

  if (status === 'editing' && editingDraft) {
    return (
      <EmployeeOrderEdit
        draft={editingDraft}
        articles={articles}
        favoriteIds={favoriteIds}
        onToggleFavorite={toggleFavorite}
        onSave={handleSaveDraft}
        onCancel={() => {
          setEditingDraft(null);
          setStatus('viewing-history');
        }}
        onDelete={() => handleDeleteDraft(editingDraft.id)}
        isSaving={isSavingDraft}
        isDeleting={isDeletingDraft === editingDraft.id}
      />
    );
  }

  // Photo Capture Mode
  if (status === 'photo-capture') {
    return (
      <PhotoCaptureTab
        articlesWithoutPhotos={articlesWithoutPhotos}
        suppliers={suppliers}
        categories={categories}
        organizationId={tokenData?.organization_id || ''}
        token={token || ''}
        onPhotoAssigned={(articleId) => {
          // Remove from local list
          setArticlesWithoutPhotos(prev => prev.filter(a => a.id !== articleId));
        }}
        onBack={() => setStatus('ready')}
      />
    );
  }

  // Voice Order Mode
  if (status === 'voice-mode') {
    const currentArticles = selectedSupplierId 
      ? allArticles.filter(a => a.supplier_id === selectedSupplierId)
      : allArticles;
    
    return (
      <VoiceOrderMode
        articles={currentArticles.map(a => ({
          id: a.id,
          name: a.name,
          unit: a.unit,
          order_unit_name: a.order_unit?.name,
        }))}
        language={tokenData?.language || i18n.language}
        token={token || ''}
        onBack={() => setStatus('ready')}
        onAddToCart={(items) => {
          items.forEach(({ articleId, quantity }) => {
            setQuantities(prev => ({
              ...prev,
              [articleId]: (prev[articleId] || 0) + quantity,
            }));
          });
        }}
      />
    );
  }

  // Wine catalog view
  if (status === 'wine-catalog' && tokenData && token) {
    return (
      <WineCatalogView
        organizationId={tokenData.organization_id}
        permission={tokenData.wine_catalog_access === 'edit' ? 'edit' : 'view'}
        onBack={() => setStatus('ready')}
        token={token}
      />
    );
  }

  // Confirmation screen for auto-approve employees (multi-supplier support)
  if (status === 'confirming' || status === 'submitting') {
    // For multi-supplier: show MultiSupplierCartOverview
    if (tokenData?.is_multi_supplier) {
      return (
        <MultiSupplierCartOverview
          articles={allArticles}
          quantities={quantities}
          suppliers={suppliers}
          deliveryDate={deliveryDate}
          timeWindow={timeWindow}
          locationName={getSelectedLocationName()}
          onQuantityChange={handleConfirmationQuantityChange}
          onRemoveItem={handleRemoveItem}
          onBack={() => {
            setSelectedSupplierId(null);
            setStatus('ready');
          }}
          onConfirm={handleSubmit}
          isSubmitting={status === 'submitting'}
          allArticles={allArticles}
          freeItems={freeItems}
          onAddFreeItem={handleAddFreeItem}
          onUpdateFreeItem={handleUpdateFreeItem}
          onDeleteFreeItem={handleDeleteFreeItem}
          onFreeItemQuantityChange={handleFreeItemQuantityChange}
          canAddFreeItems={tokenData?.can_add_free_items || false}
        />
      );
    }
    
    // Single supplier: show OrderConfirmationScreen
    const orderedArticles = allArticles.filter(a => quantities[a.id] > 0);
    return (
      <OrderConfirmationScreen
        articles={orderedArticles}
        quantities={quantities}
        supplierName={getCurrentSupplierName()}
        deliveryDate={deliveryDate}
        timeWindow={timeWindow}
        onQuantityChange={handleConfirmationQuantityChange}
        onRemoveItem={handleRemoveItem}
        onBack={() => setStatus('ready')}
        onConfirm={handleSubmit}
        isSubmitting={status === 'submitting'}
      />
    );
  }

  const showSupplierSelection = tokenData?.is_multi_supplier && !selectedSupplierId;

  return (
    <div className="min-h-screen bg-background pb-32">
      <SimpleOrderHeader
        supplierName={getCurrentSupplierName()}
        isMultiSupplier={tokenData?.is_multi_supplier || false}
        selectedSupplierId={selectedSupplierId}
        suppliers={suppliers}
        onSupplierChange={handleSupplierSelect}
        getArticleCount={getSupplierArticleCount}
        hasEmployee={!!tokenData?.has_employee}
        onViewOrders={() => {
          fetchDrafts();
          setStatus('viewing-history');
        }}
        voiceInputEnabled={tokenData?.voice_input_enabled || false}
        onVoiceMode={() => setStatus('voice-mode')}
        canCapturePhotos={tokenData?.can_capture_photos || false}
        onPhotoCapture={() => setStatus('photo-capture')}
        photoCaptureCount={articlesWithoutPhotos.length}
        wineCatalogAccess={tokenData?.wine_catalog_access || 'none'}
        onWineCatalog={() => setStatus('wine-catalog')}
      />

      {/* Supplier Selection for Multi-Supplier Tokens */}
      {showSupplierSelection && (
        <SupplierSelection
          suppliers={suppliers}
          onSelect={handleSupplierSelect}
          getArticleCount={getSupplierArticleCount}
          getCartCount={getSupplierCartCount}
          onViewCart={getTotalItems() > 0 ? handleViewCartFromSupplierSelection : undefined}
          totalCartItems={getTotalItems()}
        />
      )}

      {/* Single Supplier or Supplier Selected */}
      {!showSupplierSelection && (
        <>
          <EmployeeInfoSection
            employeeName={employeeName}
            setEmployeeName={setEmployeeName}
            isEmployeeNameLocked={isEmployeeNameLocked}
            selectedLocationId={selectedLocationId}
            setSelectedLocationId={setSelectedLocationId}
            isLocationLocked={isLocationLocked}
            locations={locations}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            variant="default"
          />
          <DeliveryInfoBar
            deliveryDate={deliveryDate}
            timeWindow={timeWindow}
            hasError={validationErrors.deliveryDate}
          />
          <ArticleList
            articles={articles}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
            search={search}
            onSearchChange={setSearch}
            allArticles={allArticles}
            suppliers={suppliers}
            selectedSupplierId={selectedSupplierId}
            onSupplierChange={handleSupplierSelect}
            favoriteIds={favoriteIds}
            onToggleFavorite={toggleFavorite}
            canAddFreeItems={tokenData?.can_add_free_items || false}
            freeItems={freeItems.filter(item => item.supplier_id === selectedSupplierId)}
            onAddFreeItem={handleAddFreeItem}
            onUpdateFreeItem={handleUpdateFreeItem}
            onDeleteFreeItem={handleDeleteFreeItem}
            onFreeItemQuantityChange={handleFreeItemQuantityChange}
            token={token}
            organizationId={tokenData?.organization_id}
            canCapturePhotos={tokenData?.can_capture_photos || false}
          />
          <SubmitBar
            totalItems={getTotalItems()}
            isSubmitting={false}
            onSubmit={handleSubmitClick}
            isAutoApproveEmployee={tokenData?.auto_approve_orders || false}
          />
        </>
      )}
    </div>
  );
};

export default SimpleOrder;
