import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, EmployeeSession } from '@/pages/EmployeeOrder';
import { Supplier, Article, EmployeeOrder } from './types';

export const useSupplierOrderState = (
  session: EmployeeSession,
  selectedLocation: { id: string; name: string },
  cart: CartItem[],
  onOrderSubmitted: () => void
) => {
  const { toast } = useToast();
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [timeWindow, setTimeWindow] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileCalendarOpen, setMobileCalendarOpen] = useState(false);
  
  // Order history state
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [employeeOrders, setEmployeeOrders] = useState<EmployeeOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Get supplier IDs assigned to this location
  const assignedSupplierIds = useMemo(() => {
    return session.locationSuppliers
      .filter(ls => ls.location_id === selectedLocation.id)
      .map(ls => ls.supplier_id);
  }, [session.locationSuppliers, selectedLocation.id]);

  // Load suppliers and articles
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (assignedSupplierIds.length > 0) {
          const { data: suppliersData, error: suppliersError } = await supabase
            .from('suppliers')
            .select('id, name, email')
            .in('id', assignedSupplierIds)
            .eq('is_active', true)
            .order('name');

          if (suppliersError) throw suppliersError;
          setSuppliers(suppliersData || []);

          const { data: articlesData, error: articlesError } = await supabase
            .from('articles')
            .select('id, name, unit, price, category, supplier_id, order_units(name)')
            .in('supplier_id', assignedSupplierIds)
            .eq('is_active', true)
            .order('sort_order')
            .order('name');

          if (articlesError) throw articlesError;
          
          const mappedArticles = (articlesData || []).map(article => ({
            id: article.id,
            name: article.name,
            unit: article.unit,
            price: article.price,
            category: article.category,
            supplier_id: article.supplier_id,
            order_unit_name: article.order_units?.name || null,
          }));
          setArticles(mappedArticles);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Fehler',
          description: 'Daten konnten nicht geladen werden',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [assignedSupplierIds, toast]);

  // Filter articles
  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSupplier = !selectedSupplier || article.supplier_id === selectedSupplier;
      const matchesSearch = !searchQuery || 
        article.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSupplier && matchesSearch;
    });
  }, [articles, selectedSupplier, searchQuery]);

  // Group articles by supplier
  const articlesBySupplier = useMemo(() => {
    const grouped: Record<string, { supplier: Supplier; articles: Article[] }> = {};
    filteredArticles.forEach(article => {
      const supplier = suppliers.find(s => s.id === article.supplier_id);
      if (!supplier) return;
      if (!grouped[supplier.id]) {
        grouped[supplier.id] = { supplier, articles: [] };
      }
      grouped[supplier.id].articles.push(article);
    });
    return Object.values(grouped).sort((a, b) => a.supplier.name.localeCompare(b.supplier.name));
  }, [filteredArticles, suppliers]);

  // Cart calculations
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Group cart by supplier
  const cartBySupplier = useMemo(() => {
    const grouped: Record<string, CartItem[]> = {};
    cart.forEach(item => {
      if (!grouped[item.supplierId]) {
        grouped[item.supplierId] = [];
      }
      grouped[item.supplierId].push(item);
    });
    return grouped;
  }, [cart]);

  const getCartQuantity = useCallback((articleId: string) => {
    return cart.find(item => item.articleId === articleId)?.quantity || 0;
  }, [cart]);

  // Submit order
  const handleSubmitOrder = useCallback(async () => {
    if (cart.length === 0) {
      toast({
        title: 'Warenkorb leer',
        description: 'Fügen Sie Artikel hinzu, um zu bestellen',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      for (const [supplierId, items] of Object.entries(cartBySupplier)) {
        const { error } = await supabase.functions.invoke('submit-simple-order', {
          body: {
            token: session.sessionToken,
            employee_name: session.employee.name,
            location_id: selectedLocation.id,
            supplier_id: supplierId,
            delivery_date: deliveryDate,
            time_window: timeWindow,
            items: items.map(item => ({
              article_id: item.articleId,
              article_name: item.articleName,
              quantity: item.quantity,
              unit: item.unit,
            })),
          },
        });

        if (error) throw error;
      }

      toast({
        title: 'Bestellung erfolgreich',
        description: `${Object.keys(cartBySupplier).length} Bestellung(en) wurden gesendet`,
      });

      onOrderSubmitted();
    } catch (error: unknown) {
      console.error('Order submission error:', error instanceof Error ? error.message : error);
      toast({
        title: 'Fehler',
        description: 'Bestellung konnte nicht gesendet werden',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, cartBySupplier, session, selectedLocation.id, deliveryDate, timeWindow, toast, onOrderSubmitted]);

  // Load employee orders
  const loadEmployeeOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, order_number, status, total_amount, delivery_address, notes, created_at,
          supplier:suppliers(id, name),
          location:locations(id, name, short_code),
          items:order_items(id, article_name, quantity, unit, unit_price, total_price)
        `)
        .eq('employee_id', session.employee.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error) {
        setEmployeeOrders(data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  }, [session.employee.id]);

  const toggleOrderExpanded = useCallback((orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  return {
    // Data
    suppliers,
    articles,
    filteredArticles,
    articlesBySupplier,
    employeeOrders,
    
    // State
    selectedSupplier,
    setSelectedSupplier,
    searchQuery,
    setSearchQuery,
    isLoading,
    isSubmitting,
    deliveryDate,
    setDeliveryDate,
    timeWindow,
    setTimeWindow,
    calendarOpen,
    setCalendarOpen,
    mobileCalendarOpen,
    setMobileCalendarOpen,
    showOrderHistory,
    setShowOrderHistory,
    isLoadingOrders,
    expandedOrders,
    
    // Computed
    cartItemCount,
    cartTotal,
    cartBySupplier,
    
    // Actions
    getCartQuantity,
    handleSubmitOrder,
    loadEmployeeOrders,
    toggleOrderExpanded,
  };
};
