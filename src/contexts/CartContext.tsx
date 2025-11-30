import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Article } from '@/hooks/useArticles';
import { toast } from 'sonner';

export interface CartItem {
  article: Article;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (article: Article, quantity?: number) => void;
  removeItem: (articleId: string) => void;
  updateQuantity: (articleId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getItemsBySupplier: () => Map<string, CartItem[]>;
  loadFromDraft: (draftItems: CartItem[]) => void;
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

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getTotal = useCallback(() => {
    return items.reduce(
      (total, item) => total + Number(item.article.price) * item.quantity,
      0
    );
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

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

  const loadFromDraft = useCallback((draftItems: CartItem[]) => {
    setItems(draftItems);
    toast.success('Entwurf in den Warenkorb geladen');
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        getItemsBySupplier,
        loadFromDraft,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
