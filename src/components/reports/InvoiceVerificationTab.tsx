import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { de, enUS } from 'date-fns/locale';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Package,
  Loader2,
  Eye,
  Check,
  X,
  Mail,
  RefreshCw,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useInvoices,
  useInvoice,
  useUploadInvoice,
  useUpdateInvoiceStatus,
  useResolveDiscrepancy,
  useCheckInvoiceEmails,
  useReanalyzeInvoice,
  useCreateArticlesFromInvoice,
  useDeleteInvoice,
  Invoice,
  InvoiceDiscrepancy,
} from '@/hooks/useInvoices';

const statusConfig: Record<Invoice['status'], { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-muted text-muted-foreground', label: 'Ausstehend' },
  processing: { icon: Loader2, color: 'bg-blue-500/20 text-blue-600', label: 'Wird analysiert' },
  matched: { icon: CheckCircle2, color: 'bg-success/20 text-success', label: 'Abgeglichen' },
  discrepancy: { icon: AlertTriangle, color: 'bg-warning/20 text-warning', label: 'Abweichungen' },
  approved: { icon: CheckCircle2, color: 'bg-success/20 text-success', label: 'Freigegeben' },
  rejected: { icon: XCircle, color: 'bg-destructive/20 text-destructive', label: 'Abgelehnt' },
};

const discrepancyTypeConfig: Record<InvoiceDiscrepancy['discrepancy_type'], { icon: React.ElementType; color: string; label: string }> = {
  price_increase: { icon: TrendingUp, color: 'text-destructive', label: 'Preiserhöhung' },
  price_decrease: { icon: TrendingDown, color: 'text-success', label: 'Preissenkung' },
  quantity_mismatch: { icon: Package, color: 'text-warning', label: 'Mengendifferenz' },
  missing_item: { icon: XCircle, color: 'text-muted-foreground', label: 'Fehlender Artikel' },
  extra_item: { icon: AlertTriangle, color: 'text-orange-500', label: 'Zusätzlicher Artikel' },
  other: { icon: AlertTriangle, color: 'text-muted-foreground', label: 'Sonstige' },
};

export function InvoiceVerificationTab() {
  const { t, i18n } = useTranslation();
  const { data: invoices, isLoading } = useInvoices();
  const uploadInvoice = useUploadInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const checkEmails = useCheckInvoiceEmails();
  const reanalyzeInvoice = useReanalyzeInvoice();
  const createArticlesFromInvoice = useCreateArticlesFromInvoice();
  const deleteInvoice = useDeleteInvoice();
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pdfDialogUrl, setPdfDialogUrl] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null); // Keep for cleanup compatibility
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const locale = i18n.language === 'de' ? de : enUS;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type === 'application/pdf') {
        uploadInvoice.mutate(file);
      }
    });
  }, [uploadInvoice]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const openPdfViewer = (pdfUrl: string) => {
    // Directly set the URL - no fetch/blob conversion needed
    setPdfDialogUrl(pdfUrl);
    setPdfBlobUrl(null); // Clear any old blob URL
  };

  const closePdfDialog = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
    setPdfDialogUrl(null);
  };

  const toggleExpanded = (id: string) => {
    setExpandedInvoices(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApprove = (invoiceId: string) => {
    updateStatus.mutate({ invoiceId, status: 'approved' });
  };

  const handleReject = (invoiceId: string) => {
    updateStatus.mutate({ invoiceId, status: 'rejected' });
  };

  const handleReanalyze = (invoiceId: string) => {
    reanalyzeInvoice.mutate(invoiceId);
  };

  const openDetails = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setShowDetailsDialog(true);
  };

  // Calculate stats
  const stats = {
    total: invoices?.length || 0,
    pending: invoices?.filter(i => i.status === 'pending' || i.status === 'processing').length || 0,
    discrepancies: invoices?.filter(i => i.status === 'discrepancy').length || 0,
    approved: invoices?.filter(i => i.status === 'approved' || i.status === 'matched').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">{t('invoices.totalInvoices', 'Rechnungen gesamt')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">{t('invoices.pending', 'Ausstehend')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-destructive">{stats.discrepancies}</div>
            <div className="text-xs text-muted-foreground">{t('invoices.withDiscrepancies', 'Mit Abweichungen')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
            <div className="text-xs text-muted-foreground">{t('invoices.approved', 'Freigegeben')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Email Check + Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Email Check Button */}
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-auto py-4"
              onClick={() => checkEmails.mutate()}
              disabled={checkEmails.isPending}
            >
              {checkEmails.isPending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Mail className="h-5 w-5 mr-2" />
              )}
              <div className="text-left">
                <div className="font-medium">{t('invoices.checkEmails', 'E-Mails prüfen')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('invoices.checkEmailsDesc', 'Neue Rechnungen aus Postfach abrufen')}
                </div>
              </div>
            </Button>

            {/* Upload Area */}
            <div
              {...getRootProps()}
              className={cn(
                'flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                uploadInvoice.isPending && 'opacity-50 pointer-events-none'
              )}
            >
              <input {...getInputProps()} />
              {uploadInvoice.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {t('invoices.uploading', 'Wird analysiert...')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">
                    {isDragActive
                      ? t('invoices.dropHere', 'PDF hier ablegen')
                      : t('invoices.dragOrClick', 'PDF hochladen')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-base">{t('invoices.recentInvoices', 'Hochgeladene Rechnungen')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t('invoices.noInvoices', 'Noch keine Rechnungen hochgeladen')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((invoice) => {
                const isExpanded = expandedInvoices.has(invoice.id);
                const StatusIcon = statusConfig[invoice.status].icon;
                const discrepancyCount = invoice.invoice_discrepancies?.filter(d => !d.is_resolved).length || 0;

                return (
                  <Collapsible
                    key={invoice.id}
                    open={isExpanded}
                    onOpenChange={() => toggleExpanded(invoice.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">
                                {invoice.suppliers?.name || t('invoices.unknownSupplier', 'Unbekannter Lieferant')}
                              </span>
                              <Badge variant="outline" className={cn('text-xs', statusConfig[invoice.status].color)}>
                                <StatusIcon className={cn('h-3 w-3 mr-1', invoice.status === 'processing' && 'animate-spin')} />
                                {statusConfig[invoice.status].label}
                              </Badge>
                              {discrepancyCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {discrepancyCount} {t('invoices.discrepancies', 'Abweichungen')}
                                </Badge>
                              )}
                              {/* Auto-created indicator from notes */}
                              {invoice.notes && (invoice.notes.includes('automatisch erstellt') || invoice.notes.includes('Lieferant wurde automatisch')) && (
                                <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  {t('invoices.autoCreated', 'Auto-erstellt')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {invoice.invoice_number && <span className="mr-3">{invoice.invoice_number}</span>}
                              {invoice.invoice_date && (
                                <span>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy', { locale })}</span>
                              )}
                            </div>
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
                      <div className="px-4 pb-4 pt-0 space-y-4">
                        {/* Invoice Items */}
                        {invoice.invoice_items && invoice.invoice_items.length > 0 && (
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
                                {invoice.invoice_items.map((item) => (
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
                                onClick={() => openPdfViewer(invoice.pdf_url!)}
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
                          {/* Add Articles to Catalog Button */}
                          {invoice.supplier_id && invoice.invoice_items && invoice.invoice_items.length > 0 && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => createArticlesFromInvoice.mutate({ 
                                invoiceId: invoice.id, 
                                supplierId: invoice.supplier_id! 
                              })}
                              disabled={createArticlesFromInvoice.isPending}
                            >
                              {createArticlesFromInvoice.isPending ? (
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
                              onClick={() => handleReanalyze(invoice.id)}
                              disabled={reanalyzeInvoice.isPending}
                            >
                              {reanalyzeInvoice.isPending ? (
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
                                onClick={() => handleApprove(invoice.id)}
                                disabled={updateStatus.isPending}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {t('invoices.approve', 'Freigeben')}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReject(invoice.id)}
                                disabled={updateStatus.isPending}
                              >
                                <X className="h-4 w-4 mr-2" />
                                {t('invoices.reject', 'Ablehnen')}
                              </Button>
                            </>
                          )}
                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingInvoice(invoice);
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
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <InvoiceDetailsDialog
        invoiceId={selectedInvoiceId}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />

      {/* PDF Viewer Dialog */}
      <Dialog open={!!pdfDialogUrl} onOpenChange={closePdfDialog}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>{t('invoices.pdfPreview', 'PDF Vorschau')}</span>
              {pdfDialogUrl && (
                <div className="flex items-center gap-2 mr-8">
                  <Button variant="outline" size="sm" asChild>
                    <a href={pdfDialogUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('invoices.openInNewTab', 'Neuer Tab')}
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={pdfDialogUrl} download>
                      <Download className="h-4 w-4 mr-2" />
                      {t('invoices.download', 'Download')}
                    </a>
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {pdfDialogUrl && (
              <object
                data={pdfDialogUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                {/* Fallback if object tag doesn't work */}
                <iframe
                  src={pdfDialogUrl}
                  className="w-full h-full border-0"
                  title="PDF Vorschau"
                />
                {/* Final fallback message */}
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {t('invoices.pdfNotSupported', 'PDF-Vorschau nicht verfügbar')}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('invoices.pdfNotSupportedDesc', 'Dein Browser unterstützt keine Inline-PDF-Anzeige.')}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild>
                      <a href={pdfDialogUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('invoices.openInNewTab', 'Neuer Tab')}
                      </a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={pdfDialogUrl} download>
                        <Download className="h-4 w-4 mr-2" />
                        {t('invoices.download', 'Download')}
                      </a>
                    </Button>
                  </div>
                </div>
              </object>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingInvoice} onOpenChange={(open) => !open && setDeletingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('invoices.deleteInvoice', 'Rechnung löschen?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'invoices.deleteInvoiceConfirm',
                'Die Rechnung "{{number}}" und die zugehörige PDF-Datei werden unwiderruflich gelöscht.',
                { number: deletingInvoice?.invoice_number || t('invoices.unknown', 'Unbekannt') }
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingInvoice) {
                  deleteInvoice.mutate({
                    id: deletingInvoice.id,
                    pdf_url: deletingInvoice.pdf_url,
                  });
                  setDeletingInvoice(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Löschen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InvoiceDetailsDialog({
  invoiceId,
  open,
  onOpenChange,
}: {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
