import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IndustryTemplate, getIndustryById } from '@/data/industryTemplates';
import { suppliers as mockSuppliers, articles as mockArticles } from '@/data/mockData';

export interface DemoCartItem {
  articleId: string;
  articleName: string;
  quantity: number;
  unit: string;
  price: number;
  supplierId: string;
  supplierName: string;
}

interface DemoContextType {
  industry: IndustryTemplate;
  setIndustryId: (id: string) => void;
  cart: DemoCartItem[];
  addToCart: (item: Omit<DemoCartItem, 'quantity'>, quantity?: number) => void;
  updateCartQuantity: (articleId: string, quantity: number) => void;
  removeFromCart: (articleId: string) => void;
  clearCart: () => void;
  getSuppliers: () => typeof mockSuppliers;
  getArticles: () => typeof mockArticles;
  cartTotal: number;
  cartItemCount: number;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [industryId, setIndustryId] = useState('gastronomy');
  const [cart, setCart] = useState<DemoCartItem[]>([]);

  const industry = getIndustryById(industryId) || getIndustryById('gastronomy')!;

  const addToCart = (item: Omit<DemoCartItem, 'quantity'>, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.articleId === item.articleId);
      if (existing) {
        return prev.map(i =>
          i.articleId === item.articleId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const updateCartQuantity = (articleId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(articleId);
      return;
    }
    setCart(prev =>
      prev.map(i => (i.articleId === articleId ? { ...i, quantity } : i))
    );
  };

  const removeFromCart = (articleId: string) => {
    setCart(prev => prev.filter(i => i.articleId !== articleId));
  };

  const clearCart = () => setCart([]);

  const getSuppliers = () => mockSuppliers;
  const getArticles = () => mockArticles;

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <DemoContext.Provider
      value={{
        industry,
        setIndustryId,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        getSuppliers,
        getArticles,
        cartTotal,
        cartItemCount,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
