import type { EmployeeSession, CartItem } from '@/pages/EmployeeOrder';

export interface SupplierOrderScreenProps {
  session: EmployeeSession;
  selectedLocation: { id: string; name: string };
  cart: CartItem[];
  onAddToCart: (item: CartItem) => void;
  onUpdateCartItem: (articleId: string, quantity: number) => void;
  onBack: () => void;
  onOrderSubmitted: () => void;
  onLogout: () => void;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
}

export interface Article {
  id: string;
  name: string;
  unit: string;
  price: number;
  category: string | null;
  supplier_id: string;
  order_unit_name: string | null;
}

export interface EmployeeOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number | null;
  delivery_address: string | null;
  notes: string | null;
  created_at: string;
  supplier?: { id: string; name: string } | null;
  location?: { id: string; name: string; short_code: string } | null;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export const TIME_WINDOW_OPTIONS = [
  { value: 'morning', label: '10-12 Uhr' },
  { value: 'afternoon', label: '12-15 Uhr' },
  { value: 'flexible', label: 'Flexibel' },
] as const;
