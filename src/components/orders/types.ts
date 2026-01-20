import { Order } from '@/hooks/useOrders';
import { CartDraft } from '@/hooks/useCartDrafts';
import { Locale } from 'date-fns';

export type DateFilter = 'all' | 'today' | 'week' | 'month' | '3months';

export interface EasyOrderGroup {
  key: string;
  employeeName: string;
  supplierNames: string[];
  drafts: CartDraft[];
  totalItems: number;
  totalPrice: number;
  desiredDeliveryDate: string | null;
  location: { id: string; name: string; short_code: string | null } | null;
  createdAt: string;
}

export interface LocationOption {
  id: string;
  name: string;
  short_code: string | null;
}

export const statusColors: Record<Order['status'], string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-success/20 text-success',
  processing: 'bg-purple-500/20 text-purple-500',
  shipped: 'bg-cyan-500/20 text-cyan-500',
  delivered: 'bg-success/20 text-success',
  cancelled: 'bg-destructive/20 text-destructive',
};

export const statusIcons = {
  pending: 'Clock',
  confirmed: 'CheckCircle2',
  processing: 'Package',
  shipped: 'Truck',
  delivered: 'CheckCircle2',
  cancelled: 'XCircle',
} as const;

export const getLocationDisplayName = (loc: { name: string; short_code: string | null }) => {
  return loc.short_code || loc.name;
};
