import { Invoice, InvoiceDiscrepancy } from '@/hooks/useInvoices';

export type ViewMode = 'supplier' | 'date' | 'flat';

export interface SupplierGroup {
  supplierId: string | null;
  supplierName: string;
  invoices: Invoice[];
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  discrepancyCount: number;
}

export interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  invoices: Invoice[];
  totalAmount: number;
}

export interface ParsedItem {
  position?: number;
  articleName: string;
  articleSku?: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export interface InvoiceStats {
  total: number;
  pending: number;
  discrepancies: number;
  approved: number;
}
