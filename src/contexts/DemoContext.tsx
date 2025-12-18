import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
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

interface DemoSupplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
}

interface DemoArticle {
  id: string;
  name: string;
  description: string;
  unit: string;
  price: number;
  category: string;
  supplierId: string;
  supplierName: string;
  isActive: boolean;
}

interface DemoContextType {
  industry: IndustryTemplate;
  setIndustryId: (id: string) => void;
  cart: DemoCartItem[];
  addToCart: (item: Omit<DemoCartItem, 'quantity'>, quantity?: number) => void;
  updateCartQuantity: (articleId: string, quantity: number) => void;
  removeFromCart: (articleId: string) => void;
  clearCart: () => void;
  getSuppliers: () => DemoSupplier[];
  getArticles: () => DemoArticle[];
  cartTotal: number;
  cartItemCount: number;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [industryId, setIndustryId] = useState('gastronomy');
  const [cart, setCart] = useState<DemoCartItem[]>([]);

  const industry = getIndustryById(industryId) || getIndustryById('gastronomy')!;

  // Generate industry-specific suppliers
  const suppliers = useMemo((): DemoSupplier[] => {
    if (industry.id === 'other' || !industry.exampleSuppliers?.length) {
      return mockSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone || '',
        address: s.address || '',
        contactPerson: s.contactPerson || '',
        organizationId: s.organizationId,
        isActive: s.isActive,
        createdAt: s.createdAt,
      }));
    }

    return industry.exampleSuppliers.map((supplier, index) => ({
      id: `supplier-${index + 1}`,
      name: supplier.name,
      email: `bestellung@${supplier.name.toLowerCase().replace(/\s/g, '-').replace(/[äöü]/g, c => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }[c] || c))}.de`,
      phone: '+49 123 456789',
      address: 'Musterstraße 1, 12345 Berlin',
      contactPerson: 'Max Mustermann',
      organizationId: '1',
      isActive: true,
      createdAt: new Date(),
    }));
  }, [industry]);

  // Generate industry-specific articles
  const articles = useMemo((): DemoArticle[] => {
    if (industry.id === 'other' || !industry.exampleSuppliers?.length) {
      return mockArticles.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description || '',
        unit: a.unit,
        price: a.price,
        category: a.category || '',
        supplierId: a.supplierId,
        supplierName: mockSuppliers.find(s => s.id === a.supplierId)?.name || '',
        isActive: a.isActive,
      }));
    }

    const allArticles: DemoArticle[] = [];
    industry.exampleSuppliers.forEach((supplier, supplierIndex) => {
      supplier.articles.forEach((article, articleIndex) => {
        allArticles.push({
          id: `article-${supplierIndex}-${articleIndex}`,
          name: article.name,
          description: '',
          unit: article.unit,
          price: article.price,
          category: article.category,
          supplierId: `supplier-${supplierIndex + 1}`,
          supplierName: supplier.name,
          isActive: true,
        });
      });
    });
    return allArticles;
  }, [industry]);

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

  const getSuppliers = () => suppliers;
  const getArticles = () => articles;

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
