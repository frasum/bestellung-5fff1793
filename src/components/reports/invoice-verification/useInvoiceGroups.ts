import { useMemo } from 'react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Invoice } from '@/hooks/useInvoices';
import { SupplierGroup, MonthGroup, InvoiceStats } from './types';

export function useInvoiceGroups(
  invoices: Invoice[] | undefined,
  language: string,
  t: (key: string, fallback: string) => string
) {
  const locale = language === 'de' ? de : enUS;

  const groupInvoicesBySupplier = useMemo((): SupplierGroup[] => {
    if (!invoices) return [];
    
    const groups = new Map<string, SupplierGroup>();
    
    invoices.forEach(invoice => {
      const supplierId = invoice.supplier_id || 'unknown';
      const supplierName = invoice.suppliers?.name || t('invoices.unknownSupplier', 'Unbekannter Lieferant');
      
      if (!groups.has(supplierId)) {
        groups.set(supplierId, {
          supplierId: invoice.supplier_id,
          supplierName,
          invoices: [],
          totalAmount: 0,
          pendingCount: 0,
          approvedCount: 0,
          discrepancyCount: 0,
        });
      }
      
      const group = groups.get(supplierId)!;
      group.invoices.push(invoice);
      group.totalAmount += Number(invoice.gross_amount || 0);
      
      if (invoice.status === 'pending' || invoice.status === 'processing') {
        group.pendingCount++;
      } else if (invoice.status === 'approved' || invoice.status === 'matched') {
        group.approvedCount++;
      } else if (invoice.status === 'discrepancy') {
        group.discrepancyCount++;
      }
    });
    
    return Array.from(groups.values())
      .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
      .map(group => ({
        ...group,
        invoices: group.invoices.sort((a, b) => {
          const dateA = a.invoice_date ? new Date(a.invoice_date).getTime() : 0;
          const dateB = b.invoice_date ? new Date(b.invoice_date).getTime() : 0;
          return dateB - dateA;
        }),
      }));
  }, [invoices, t]);

  const groupInvoicesByMonth = useMemo((): MonthGroup[] => {
    if (!invoices) return [];
    
    const groups = new Map<string, MonthGroup>();
    
    invoices.forEach(invoice => {
      const invoiceDate = invoice.invoice_date ? new Date(invoice.invoice_date) : new Date(invoice.created_at);
      const monthKey = format(invoiceDate, 'yyyy-MM');
      const monthLabel = format(invoiceDate, 'MMMM yyyy', { locale });
      
      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          monthKey,
          monthLabel,
          invoices: [],
          totalAmount: 0,
        });
      }
      
      const group = groups.get(monthKey)!;
      group.invoices.push(invoice);
      group.totalAmount += Number(invoice.gross_amount || 0);
    });
    
    return Array.from(groups.values())
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map(group => ({
        ...group,
        invoices: group.invoices.sort((a, b) => {
          const nameA = a.suppliers?.name || '';
          const nameB = b.suppliers?.name || '';
          return nameA.localeCompare(nameB);
        }),
      }));
  }, [invoices, locale]);

  const stats: InvoiceStats = useMemo(() => ({
    total: invoices?.length || 0,
    pending: invoices?.filter(i => i.status === 'pending' || i.status === 'processing').length || 0,
    discrepancies: invoices?.filter(i => i.status === 'discrepancy').length || 0,
    approved: invoices?.filter(i => i.status === 'approved' || i.status === 'matched').length || 0,
  }), [invoices]);

  return {
    groupInvoicesBySupplier,
    groupInvoicesByMonth,
    stats,
    locale,
  };
}
