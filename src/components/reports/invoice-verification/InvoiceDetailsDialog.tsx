import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInvoice } from '@/hooks/useInvoices';

interface InvoiceDetailsDialogProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvoiceDetailsDialog({
  invoiceId,
  open,
  onOpenChange,
}: InvoiceDetailsDialogProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('invoices.invoiceDetails', 'Rechnungsdetails')}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : invoice ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">{t('invoices.supplier', 'Lieferant')}</div>
                <div className="font-medium">{invoice.suppliers?.name || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('invoices.invoiceNumber', 'Rechnungsnummer')}</div>
                <div className="font-medium">{invoice.invoice_number || '-'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('invoices.invoiceDate', 'Rechnungsdatum')}</div>
                <div className="font-medium">
                  {invoice.invoice_date ? format(new Date(invoice.invoice_date), 'dd.MM.yyyy') : '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('invoices.grossAmount', 'Bruttobetrag')}</div>
                <div className="font-medium">
                  €{Number(invoice.gross_amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
