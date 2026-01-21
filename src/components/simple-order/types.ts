export interface Article {
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

export interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  sort_order?: number;
}

export interface TokenData {
  id: string;
  label: string;
  language: string;
  is_multi_supplier: boolean;
  employee_id: string | null;
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

export interface Category {
  id: string;
  name: string;
}

export interface DraftItem {
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

export interface Draft {
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

export interface CompletedOrderItem {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface CompletedOrder {
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

export type OrderStatus = 
  | 'loading' 
  | 'pin-entry' 
  | 'location-date' 
  | 'ready' 
  | 'confirming' 
  | 'submitting' 
  | 'success' 
  | 'error' 
  | 'viewing-history' 
  | 'editing' 
  | 'voice-mode' 
  | 'photo-capture' 
  | 'wine-catalog';
