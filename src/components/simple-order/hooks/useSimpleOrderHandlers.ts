import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Article, TokenData, Draft, OrderStatus, CompletedOrder } from '../types';
import { FreeItem } from '../FreeItemDialog';

interface UseSimpleOrderHandlersProps {
  token: string | undefined;
  tokenData: TokenData | null;
  allArticles: Article[];
  quantities: Record<string, number>;
  setQuantities: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  freeItems: FreeItem[];
  setFreeItems: React.Dispatch<React.SetStateAction<FreeItem[]>>;
  employeeName: string;
  selectedLocationId: string | null;
  deliveryDate: Date | undefined;
  timeWindow: string;
  isEmployeeNameLocked: boolean;
  setEmployeeName: React.Dispatch<React.SetStateAction<string>>;
  setValidationErrors: React.Dispatch<React.SetStateAction<{ name?: boolean; location?: boolean; deliveryDate?: boolean }>>;
  status: OrderStatus;
  setStatus: React.Dispatch<React.SetStateAction<OrderStatus>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAutoApproved: React.Dispatch<React.SetStateAction<boolean>>;
  setOrderNumber: React.Dispatch<React.SetStateAction<string | null>>;
  hasEmployee: boolean;
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  setSelectedSupplierId: React.Dispatch<React.SetStateAction<string | null>>;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  favoriteIds: Set<string>;
  setFavoriteIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  drafts: Draft[];
  setDrafts: React.Dispatch<React.SetStateAction<Draft[]>>;
  setCompletedOrders: React.Dispatch<React.SetStateAction<CompletedOrder[]>>;
  setIsLoadingDrafts: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDeletingDraft: React.Dispatch<React.SetStateAction<string | null>>;
  editingDraft: Draft | null;
  setEditingDraft: React.Dispatch<React.SetStateAction<Draft | null>>;
  setIsSavingDraft: React.Dispatch<React.SetStateAction<boolean>>;
  setPinVerified: React.Dispatch<React.SetStateAction<boolean>>;
  getTotalItems: () => number;
}

export const useSimpleOrderHandlers = ({
  token,
  tokenData,
  allArticles,
  quantities,
  setQuantities,
  freeItems,
  setFreeItems,
  employeeName,
  selectedLocationId,
  deliveryDate,
  timeWindow,
  isEmployeeNameLocked,
  setEmployeeName,
  setValidationErrors,
  status,
  setStatus,
  setError,
  setIsAutoApproved,
  setOrderNumber,
  hasEmployee,
  setArticles,
  setSelectedSupplierId,
  setSearch,
  favoriteIds,
  setFavoriteIds,
  drafts,
  setDrafts,
  setCompletedOrders,
  setIsLoadingDrafts,
  setIsDeletingDraft,
  editingDraft,
  setEditingDraft,
  setIsSavingDraft,
  setPinVerified,
  getTotalItems,
}: UseSimpleOrderHandlersProps) => {
  const { t } = useTranslation();

  // Supplier selection handlers
  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setSearch('');
  };

  const handleBackToSuppliers = () => {
    setSelectedSupplierId(null);
    setSearch('');
  };

  // Quantity handlers
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

  const handleConfirmationQuantityChange = (articleId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[articleId] || 0;
      const newValue = Math.max(1, current + delta);
      return { ...prev, [articleId]: newValue };
    });
  };

  const handleRemoveItem = (articleId: string) => {
    setQuantities(prev => {
      const { [articleId]: _, ...rest } = prev;
      return rest;
    });
    if (Object.keys(quantities).length <= 1) {
      setStatus('ready');
    }
  };

  // Favorite handlers
  const toggleFavorite = async (articleId: string) => {
    const isFavorite = favoriteIds.has(articleId);
    const action = isFavorite ? 'remove' : 'add';
    
    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFavorite) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });

    if (hasEmployee && token) {
      try {
        const { data, error } = await supabase.functions.invoke('manage-simple-order-favorites', {
          body: { token, article_id: articleId, action },
        });
        
        if (error || data?.error) {
          console.error('Error toggling favorite:', error || data?.error);
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

  // Validation
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

  // Submit handlers
  const handleSubmitClick = () => {
    if (getTotalItems() === 0) return;
    if (!validateForm()) return;

    if (tokenData?.is_multi_supplier || tokenData?.auto_approve_orders) {
      setStatus('confirming');
    } else {
      handleSubmit();
    }
  };

  const handleViewCartFromSupplierSelection = () => {
    if (getTotalItems() === 0) return;
    setStatus('confirming');
  };

  const handleSubmit = async () => {
    if (getTotalItems() === 0) return;
    if (!validateForm()) return;

    setStatus('submitting');

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


    const allSupplierIds = new Set([
      ...Object.keys(itemsBySupplier),
      ...Object.keys(freeItemsBySupplier),
    ]);
    const supplierIds = Array.from(allSupplierIds);
    
    try {
      const results = await Promise.all(
        supplierIds.map(async (supplierId) => {
          const items = itemsBySupplier[supplierId] || [];
          const freeItemsForSupplier = freeItemsBySupplier[supplierId] || [];
          
          
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


      const errors = results.filter(r => {
        if (r.error) return true;
        if (r.data?.error) return true;
        if (r.data && r.data.success === false) return true;
        return false;
      });
      
      if (errors.length > 0) {
        console.error('Errors submitting orders:', errors);
        setError(errors[0].data?.error || errors[0].error?.message || 'Unbekannter Fehler');
        setStatus('error');
        return;
      }

      const firstResult = results[0];
      if (firstResult?.data?.auto_approved) {
        setIsAutoApproved(true);
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

  // Draft handlers
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

  const handleViewOrders = async () => {
    setStatus('viewing-history');
    await fetchDrafts();
  };

  const handleEditDraft = (draftId: string) => {
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      const supplierId = draft.items[0]?.article?.supplier_id;
      if (supplierId) {
        const supplierArticles = allArticles.filter(a => a.supplier_id === supplierId);
        setArticles(supplierArticles);
        setSelectedSupplierId(supplierId);
      }
      setEditingDraft(draft);
      setStatus('editing');
    }
  };

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

  // PIN handlers
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
    if (tokenData?.is_multi_supplier) {
      setStatus('location-date');
    } else {
      setStatus('ready');
    }
  };

  const handleLocationDateContinue = () => {
    setStatus('ready');
  };

  const handleNewOrder = () => {
    setStatus('ready');
    setIsAutoApproved(false);
    setOrderNumber(null);
    if (!isEmployeeNameLocked) {
      setEmployeeName('');
    }
  };

  return {
    // Supplier handlers
    handleSupplierSelect,
    handleBackToSuppliers,
    
    // Quantity handlers
    handleQuantityChange,
    handleConfirmationQuantityChange,
    handleRemoveItem,
    
    // Favorite handlers
    toggleFavorite,
    
    // Free item handlers
    handleAddFreeItem,
    handleUpdateFreeItem,
    handleDeleteFreeItem,
    handleFreeItemQuantityChange,
    
    // Validation & submit
    validateForm,
    handleSubmitClick,
    handleViewCartFromSupplierSelection,
    handleSubmit,
    
    // Draft handlers
    fetchDrafts,
    handleViewOrders,
    handleEditDraft,
    handleSaveDraft,
    handleDeleteDraft,
    
    // PIN handlers
    handlePinVerify,
    handlePinSuccess,
    handleLocationDateContinue,
    handleNewOrder,
  };
};
