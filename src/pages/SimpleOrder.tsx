import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

// Extracted components
import { SimpleOrderHeader } from '@/components/simple-order/SimpleOrderHeader';
import { EmployeeInfoSection } from '@/components/simple-order/EmployeeInfoSection';
import { SupplierSelection } from '@/components/simple-order/SupplierSelection';
import { ArticleList } from '@/components/simple-order/ArticleList';
import { SubmitBar } from '@/components/simple-order/SubmitBar';
import { DeliveryDateSection } from '@/components/simple-order/DeliveryDateSection';
import { LoadingScreen, ErrorScreen, SuccessScreen } from '@/components/simple-order/StatusScreens';

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

type OrderStatus = 'loading' | 'ready' | 'submitting' | 'success' | 'error';

const SimpleOrder = () => {
  const { token } = useParams<{ token: string }>();
  const { i18n } = useTranslation();
  
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
  const [validationErrors, setValidationErrors] = useState<{ name?: boolean; location?: boolean }>({});
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [timeWindow, setTimeWindow] = useState<string>('flexible');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hasEmployee, setHasEmployee] = useState(false);

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

        setTokenData(data.tokenData);
        setAllArticles(data.articles || []);
        setLocations(data.locations || []);
        setHasEmployee(data.tokenData?.has_employee || false);
        
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
        
        setStatus('ready');
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

  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setQuantities({});
    setSearch('');
  };

  const handleBackToSuppliers = () => {
    setSelectedSupplierId(null);
    setQuantities({});
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
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const validateForm = (): boolean => {
    const errors: { name?: boolean; location?: boolean } = {};
    
    if (!isEmployeeNameLocked && !employeeName.trim()) {
      errors.name = true;
    }
    if (!selectedLocationId) {
      errors.location = true;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (getTotalItems() === 0) return;
    
    if (!validateForm()) return;

    setStatus('submitting');

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([articleId, quantity]) => {
        const article = articles.find(a => a.id === articleId);
        return {
          article_id: articleId,
          article_name: article?.name || '',
          quantity,
        };
      });

    try {
      const { data, error: submitError } = await supabase.functions.invoke('submit-simple-order', {
        body: { 
          token, 
          items,
          employee_name: employeeName.trim(),
          location_id: selectedLocationId,
          supplier_id: selectedSupplierId,
          delivery_date: deliveryDate?.toISOString().split('T')[0] || null,
          time_window: timeWindow || null,
        },
      });

      if (submitError || data?.error) {
        setError(data?.error || submitError?.message);
        setStatus('error');
        return;
      }

      setStatus('success');
      setQuantities({});
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('เกิดข้อผิดพลาดในการส่ง / Fehler beim Senden');
      setStatus('error');
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

  // Status screens
  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'error') {
    return <ErrorScreen error={error} />;
  }

  if (status === 'success') {
    return (
      <SuccessScreen 
        onNewOrder={() => {
          setStatus('ready');
          if (!isEmployeeNameLocked) {
            setEmployeeName('');
          }
        }} 
      />
    );
  }

  const showSupplierSelection = tokenData?.is_multi_supplier && !selectedSupplierId;

  return (
    <div className="min-h-screen bg-background pb-32">
      <SimpleOrderHeader
        supplierName={getCurrentSupplierName()}
        selectedLocationName={getSelectedLocationName()}
        selectedLocationId={selectedLocationId}
        isMultiSupplier={tokenData?.is_multi_supplier || false}
        selectedSupplierId={selectedSupplierId}
        suppliers={suppliers}
        onSupplierChange={handleSupplierSelect}
        getArticleCount={getSupplierArticleCount}
      />

      {/* Supplier Selection for Multi-Supplier Tokens */}
      {showSupplierSelection && (
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
            variant="supplier-selection"
          />
          <SupplierSelection
            suppliers={suppliers}
            onSelect={handleSupplierSelect}
            getArticleCount={getSupplierArticleCount}
          />
        </>
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
          <DeliveryDateSection
            deliveryDate={deliveryDate}
            onDeliveryDateChange={setDeliveryDate}
            timeWindow={timeWindow}
            onTimeWindowChange={setTimeWindow}
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
          />
          <SubmitBar
            totalItems={getTotalItems()}
            isSubmitting={status === 'submitting'}
            onSubmit={handleSubmit}
          />
        </>
      )}
    </div>
  );
};

export default SimpleOrder;
