import { memo, useMemo } from 'react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { TFunction } from 'i18next';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Check,
  X,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Invoice, isInvoiceStuck } from '@/hooks/useInvoices';
import { InvoiceProcessingSummary } from '../InvoiceProcessingSummary';
import { statusConfig, discrepancyTypeConfig } from './config';
import { ParsedItem } from './types';

interface InvoiceRowProps {
  invoice: Invoice;
  isExpanded: boolean;
  onToggle: () => void;
  locale: typeof de | typeof enUS;
  onOpenPdf: (url: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onReanalyze: (id: string) => void;
  onDelete: (invoice: Invoice) => void;
  onCreateArticles: (invoiceId: string, supplierId: string) => void;
  isPending: {
    update: boolean;
    reanalyze: boolean;
    createArticles: boolean;
  };
  showSupplierName: boolean;
  t: TFunction<'translation', undefined>;
}

export const InvoiceRow = memo(function InvoiceRow({
  invoice,
  isExpanded,
  onToggle,
  locale,
  onOpenPdf,
  onApprove,
  onReject,
  onReanalyze,
  onDelete,
  onCreateArticles,
  isPending,
  showSupplierName,
  t,
}: InvoiceRowProps) {
  const isStuck = isInvoiceStuck(invoice);
  const displayStatus = isStuck ? 'stuck' : invoice.status;
  const StatusIcon = statusConfig[displayStatus].icon;
  
  const discrepancyCount = useMemo(() => 
    invoice.invoice_discrepancies?.filter(d => !d.is_resolved).length || 0,
    [invoice.invoice_discrepancies]
  );

  const invoiceItems = useMemo(() => {
    if (invoice.invoice_items && invoice.invoice_items.length > 0) {
      return invoice.invoice_items;
    }
    return ((invoice.parsed_data?.items as ParsedItem[]) || []).map((item, index) => ({
      id: `parsed-${index}`,
      invoice_id: invoice.id,
      article_name: item.articleName,
      article_sku: item.articleSku || null,
      quantity: item.quantity,
      unit: item.unit || null,
      unit_price: item.unitPrice || null,
      total_price: item.totalPrice || null,
      position_number: item.position || index + 1,
      matched_order_item_id: null,
      matched_article_id: null,
      created_at: invoice.created_at,
    }));
  }, [invoice.invoice_items, invoice.parsed_data?.items, invoice.id, invoice.created_at]);

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer pl-8">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {showSupplierName && (
                  <span className="font-medium truncate">
                    {invoice.suppliers?.name || t('invoices.unknownSupplier', 'Unbekannter Lieferant')}
                  </span>
                )}
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs', 
                    statusConfig[displayStatus].color,
                    isStuck && 'cursor-pointer hover:bg-destructive/30'
                  )}
                  onClick={isStuck ? (e) => {
                    e.stopPropagation();
                    onReanalyze(invoice.id);
                  } : undefined}
                >
                  <StatusIcon className={cn('h-3 w-3 mr-1', invoice.status === 'processing' && !isStuck && 'animate-spin')} />
                  {statusConfig[displayStatus].label}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                {invoice.invoice_number && <span>{invoice.invoice_number}</span>}
                {invoice.invoice_date && (
                  <span>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale })}</span>
                )}
              </div>
              <InvoiceProcessingSummary 
                parsedData={invoice.parsed_data}
                matchedOrderNumber={invoice.orders?.order_number}
                discrepancyCount={discrepancyCount}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {invoice.gross_amount && (
              <span className="font-semibold">
                €{Number(invoice.gross_amount).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-8 pb-4 pt-0 space-y-4">
          {/* Invoice Items */}
          {invoiceItems.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">{t('common.article', 'Artikel')}</TableHead>
                    <TableHead className="text-right">{t('common.quantity', 'Menge')}</TableHead>
                    <TableHead className="text-right">{t('common.unitPrice', 'Stückpreis')}</TableHead>
                    <TableHead className="text-right">{t('common.total', 'Gesamt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>{item.article_name}</div>
                        {item.article_sku && (
                          <div className="text-xs text-muted-foreground">{item.article_sku}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        €{Number(item.unit_price || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        €{Number(item.total_price || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Discrepancies */}
          {invoice.invoice_discrepancies && invoice.invoice_discrepancies.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('invoices.foundDiscrepancies', 'Gefundene Abweichungen')}
              </h4>
              <div className="space-y-2">
                {invoice.invoice_discrepancies.map((disc) => {
                  const config = discrepancyTypeConfig[disc.discrepancy_type];
                  const DiscIcon = config.icon;
                  
                  return (
                    <div
                      key={disc.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-md border',
                        disc.is_resolved ? 'bg-muted/30 opacity-60' : 'bg-destructive/5 border-destructive/20'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <DiscIcon className={cn('h-5 w-5', config.color)} />
                        <div>
                          <div className="font-medium text-sm">{config.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {t('invoices.expected', 'Erwartet')}: {disc.expected_value} → {t('invoices.actual', 'Tatsächlich')}: {disc.actual_value}
                          </div>
                          {disc.difference_percent && (
                            <div className={cn('text-xs font-medium', config.color)}>
                              {disc.difference_percent > 0 ? '+' : ''}{disc.difference_percent.toFixed(1)}%
                              {disc.difference_amount && ` (€${disc.difference_amount.toFixed(2)})`}
                            </div>
                          )}
                        </div>
                      </div>
                      {disc.is_resolved && (
                        <Badge variant="secondary" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {t('invoices.resolved', 'Geklärt')}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            {invoice.pdf_url && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onOpenPdf(invoice.pdf_url!)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {t('invoices.viewPdf', 'PDF anzeigen')}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <a href={invoice.pdf_url} download>
                    <Download className="h-4 w-4 mr-2" />
                    {t('invoices.download', 'Download')}
                  </a>
                </Button>
              </>
            )}
            {invoice.supplier_id && invoice.invoice_items && invoice.invoice_items.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCreateArticles(invoice.id, invoice.supplier_id!)}
                disabled={isPending.createArticles}
              >
                {isPending.createArticles ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('invoices.addArticlesToCatalog', 'Artikel übernehmen')}
              </Button>
            )}
            {invoice.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReanalyze(invoice.id)}
                disabled={isPending.reanalyze}
              >
                {isPending.reanalyze ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t('invoices.reanalyze', 'Erneut analysieren')}
              </Button>
            )}
            {(invoice.status === 'matched' || invoice.status === 'discrepancy') && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onApprove(invoice.id)}
                  disabled={isPending.update}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {t('invoices.approve', 'Freigeben')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject(invoice.id)}
                  disabled={isPending.update}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('invoices.reject', 'Ablehnen')}
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(invoice);
              }}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete', 'Löschen')}
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});

InvoiceRow.displayName = 'InvoiceRow';
