import {
  Clock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';
import { Invoice, InvoiceDiscrepancy } from '@/hooks/useInvoices';

export const statusConfig: Record<Invoice['status'] | 'stuck', { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-muted text-muted-foreground', label: 'Neu' },
  processing: { icon: Loader2, color: 'bg-blue-500/20 text-blue-600', label: 'Wird analysiert' },
  stuck: { icon: AlertTriangle, color: 'bg-destructive/20 text-destructive', label: 'Hängt - Erneut versuchen?' },
  matched: { icon: CheckCircle2, color: 'bg-success/20 text-success', label: 'Abgeglichen' },
  discrepancy: { icon: AlertTriangle, color: 'bg-warning/20 text-warning', label: 'Abweichungen' },
  approved: { icon: CheckCircle2, color: 'bg-success/20 text-success', label: 'Freigegeben' },
  rejected: { icon: XCircle, color: 'bg-destructive/20 text-destructive', label: 'Abgelehnt' },
};

export const discrepancyTypeConfig: Record<InvoiceDiscrepancy['discrepancy_type'], { icon: React.ElementType; color: string; label: string }> = {
  price_increase: { icon: TrendingUp, color: 'text-destructive', label: 'Preiserhöhung' },
  price_decrease: { icon: TrendingDown, color: 'text-success', label: 'Preissenkung' },
  quantity_mismatch: { icon: Package, color: 'text-warning', label: 'Mengendifferenz' },
  missing_item: { icon: XCircle, color: 'text-muted-foreground', label: 'Fehlender Artikel' },
  extra_item: { icon: AlertTriangle, color: 'text-orange-500', label: 'Zusätzlicher Artikel' },
  other: { icon: AlertTriangle, color: 'text-muted-foreground', label: 'Sonstige' },
};
