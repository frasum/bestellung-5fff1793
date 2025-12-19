export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'purchaser' | 'viewer';
  organizationId: string;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  subscriptionTier: SubscriptionTier;
  trialEndsAt?: Date;
  createdAt: Date;
}

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise' | 'sponsored';

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  organizationId: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Article {
  id: string;
  name: string;
  description?: string;
  unit: string;
  price: number;
  category: string;
  supplierId: string;
  supplierName: string;
  sku?: string;
  isActive: boolean;
}

export interface CartItem {
  article: Article;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  organizationId: string;
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  deliveryAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  articleId: string;
  articleName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  activeSuppliers: number;
  pendingOrders: number;
  monthlySpending: { month: string; amount: number }[];
  topSuppliers: { name: string; amount: number }[];
}

export interface PricingPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    ordersPerMonth: number | 'unlimited';
    suppliers: number | 'unlimited';
    users: number | 'unlimited';
  };
  isPopular?: boolean;
}
