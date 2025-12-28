import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Article } from '@/hooks/useArticles';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCart } from '@/hooks/useActiveCart';

export interface CartItem {
  article: Article;
  quantity: number;
}

export interface FreeCartItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  supplier_id: string;
}

interface CartContextType {
  items: CartItem[];
  freeItems: FreeCartItem[];
  addItem: (article: Article, quantity?: number) => void;
  removeItem: (articleId: string) => void;
  updateQuantity: (articleId: string, quantity: number) => void;
  addFreeItem: (item: FreeCartItem) => void;
  removeFreeItem: (itemId: string) => void;
  updateFreeItemQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemsBySupplier: () => Map<string, CartItem[]>;
  loadFromDraft: (draftItems: CartItem[], deliveryDate?: string | null, timeWindow?: string | null, locationId?: string | null, employeeId?: string | null, freeItems?: FreeCartItem[]) => void;
  draftDeliveryDate: Date | null;
  draftTimeWindow: string | null;
  draftLocationId: string | null;
  draftEmployeeId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [freeItems, setFreeItems] = useState<FreeCartItem[]>([]);
  const [draftDeliveryDate, setDraftDeliveryDate] = useState<Date | null>(null);
  const [draftTimeWindow, setDraftTimeWindow] = useState<string | null>(null);
  const [draftLocationId, setDraftLocationId] = useState<string | null>(null);
  const [draftEmployeeId, setDraftEmployeeId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { loadCart, debouncedSave, clearSavedCart } = useActiveCart();
  const userRef = useRef<{ id: string; organizationId: string } | null>(null);

  // Load cart from database on mount
  useEffect(() => {
    const loadSavedCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoaded(true);
        return;
      }

      // Get user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.organization_id) {
        setIsLoaded(true);
        return;
      }

      userRef.current = { id: session.user.id, organizationId: profile.organization_id };

      const savedCart = await loadCart(session.user.id, profile.organization_id);
      if (savedCart) {
        setItems(savedCart.items);
        setFreeItems(savedCart.freeItems);
        setDraftDeliveryDate(savedCart.deliveryDate);
        setDraftTimeWindow(savedCart.timeWindow);
        setDraftLocationId(savedCart.locationId);
        setDraftEmployeeId(savedCart.employeeId);
      }
      setIsLoaded(true);
    };

    loadSavedCart();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', session.user.id)
          .single();

        if (profile?.organization_id) {
          userRef.current = { id: session.user.id, organizationId: profile.organization_id };
          const savedCart = await loadCart(session.user.id, profile.organization_id);
          if (savedCart) {
            setItems(savedCart.items);
            setFreeItems(savedCart.freeItems);
            setDraftDeliveryDate(savedCart.deliveryDate);
            setDraftTimeWindow(savedCart.timeWindow);
            setDraftLocationId(savedCart.locationId);
            setDraftEmployeeId(savedCart.employeeId);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        userRef.current = null;
        setItems([]);
        setFreeItems([]);
        setDraftDeliveryDate(null);
        setDraftTimeWindow(null);
        setDraftLocationId(null);
        setDraftEmployeeId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadCart]);

  // Auto-save cart when items change
  useEffect(() => {
    if (!isLoaded || !userRef.current) return;

    debouncedSave(
      userRef.current.id,
      userRef.current.organizationId,
      items,
      freeItems,
      draftDeliveryDate,
      draftTimeWindow,
      draftLocationId,
      draftEmployeeId
    );
  }, [items, freeItems, draftDeliveryDate, draftTimeWindow, draftLocationId, draftEmployeeId, isLoaded, debouncedSave]);

  const addItem = useCallback((article: Article, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.article.id === article.id);
      if (existing) {
        toast.success(`Updated ${article.name} quantity`);
        return prev.map((item) =>
          item.article.id === article.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`Added ${article.name} to cart`);
      return [...prev, { article, quantity }];
    });
  }, []);

  const removeItem = useCallback((articleId: string) => {
    setItems((prev) => prev.filter((item) => item.article.id !== articleId));
    toast.success('Removed from cart');
  }, []);

  const updateQuantity = useCallback((articleId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(articleId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.article.id === articleId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const addFreeItem = useCallback((item: FreeCartItem) => {
    setFreeItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFreeItem = useCallback((itemId: string) => {
    setFreeItems((prev) => prev.filter((item) => item.id !== itemId));
    toast.success('Freier Artikel entfernt');
  }, []);

  const updateFreeItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFreeItem(itemId);
      return;
    }
    setFreeItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFreeItem]);

  const clearCart = useCallback(async () => {
    setItems([]);
    setFreeItems([]);
    setDraftDeliveryDate(null);
    setDraftTimeWindow(null);
    setDraftLocationId(null);
    setDraftEmployeeId(null);
    
    // Also clear from database
    if (userRef.current) {
      await clearSavedCart(userRef.current.id);
    }
  }, [clearSavedCart]);

  const getTotal = useCallback(() => {
    return items.reduce(
      (total, item) => total + Number(item.article.price) * item.quantity,
      0
    );
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0) + freeItems.reduce((count, item) => count + item.quantity, 0);
  }, [items, freeItems]);

  const getItemsBySupplier = useCallback(() => {
    const supplierMap = new Map<string, CartItem[]>();
    items.forEach((item) => {
      const supplierId = item.article.supplier_id;
      const supplierItems = supplierMap.get(supplierId) || [];
      supplierItems.push(item);
      supplierMap.set(supplierId, supplierItems);
    });
    return supplierMap;
  }, [items]);

  const loadFromDraft = useCallback((
    draftItems: CartItem[],
    deliveryDate?: string | null,
    timeWindow?: string | null,
    locationId?: string | null,
    employeeId?: string | null,
    draftFreeItems?: FreeCartItem[]
  ) => {
    setItems(draftItems);
    setFreeItems(draftFreeItems || []);
    setDraftDeliveryDate(deliveryDate ? new Date(deliveryDate) : null);
    setDraftTimeWindow(timeWindow || null);
    setDraftLocationId(locationId || null);
    setDraftEmployeeId(employeeId || null);
    toast.success('Entwurf in den Warenkorb geladen');
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        freeItems,
        addItem,
        removeItem,
        updateQuantity,
        addFreeItem,
        removeFreeItem,
        updateFreeItemQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getItemsBySupplier,
        loadFromDraft,
        draftDeliveryDate,
        draftTimeWindow,
        draftLocationId,
        draftEmployeeId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
