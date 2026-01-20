import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Mail,
  Download,
  ExternalLink,
  Clock,
  Building2,
  Calendar,
  List,
  ChevronsUpDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { cn } from '@/lib/utils';
import {
  useInvoices,
  useUploadInvoice,
  useUpdateInvoiceStatus,
  useCheckInvoiceEmails,
  useReanalyzeInvoice,
  useCreateArticlesFromInvoice,
  useDeleteInvoice,
  useInvoiceProcessingStatus,
  Invoice,
} from '@/hooks/useInvoices';
import { Progress } from '@/components/ui/progress';

import {
  ViewMode,
  useInvoiceGroups,
  InvoiceStatsCards,
  InvoiceRow,
  InvoiceDetailsDialog,
} from './invoice-verification';

export function InvoiceVerificationTab() {
  const { t, i18n } = useTranslation();
  const { data: invoices, isLoading } = useInvoices();
  const uploadInvoice = useUploadInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const checkEmails = useCheckInvoiceEmails();
  const { status: processingStatus, isProcessing, progress } = useInvoiceProcessingStatus();
  const reanalyzeInvoice = useReanalyzeInvoice();
  const createArticlesFromInvoice = useCreateArticlesFromInvoice();
  const deleteInvoice = useDeleteInvoice();
  
  // Timer for automatic email check (5 minutes = 300 seconds)
  const [nextCheckIn, setNextCheckIn] = useState<number>(5 * 60);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setNextCheckIn(prev => {
        if (prev <= 1) {
          checkEmails.mutate();
          return 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('supplier');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pdfDialogUrl, setPdfDialogUrl] = useState<string | null>(null);
  const [pdfViewerError, setPdfViewerError] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const { groupInvoicesBySupplier, groupInvoicesByMonth, stats, locale } = useInvoiceGroups(
    invoices,
    i18n.language,
    t
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const expandAllGroups = () => {
    if (viewMode === 'supplier') {
      setExpandedGroups(new Set(groupInvoicesBySupplier.map(g => g.supplierId || 'unknown')));
    } else if (viewMode === 'date') {
      setExpandedGroups(new Set(groupInvoicesByMonth.map(g => g.monthKey)));
    }
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

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
    setPdfDialogUrl(pdfUrl);
    setPdfViewerError(null);
  };

  const closePdfDialog = () => {
    setPdfDialogUrl(null);
    setPdfViewerError(null);
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

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <InvoiceStatsCards stats={stats} />

      {/* Email Check + Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Email Check Button */}
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-auto py-4"
              onClick={() => {
                checkEmails.mutate();
                setNextCheckIn(5 * 60);
              }}
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
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  Nächste Prüfung in {Math.floor(nextCheckIn / 60)}:{String(nextCheckIn % 60).padStart(2, '0')}
                </div>
              </div>
            </Button>

            {/* Processing Progress Indicator */}
            {isProcessing && processingStatus && (
              <div className="flex-1 bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    {t('invoices.processingInBackground', 'Verarbeite Rechnungen...')}
                  </span>
                </div>
                <Progress value={progress} className="h-2 mb-1" />
                <div className="text-xs text-muted-foreground">
                  {processingStatus.processed_pdfs} von {processingStatus.total_pdfs} PDFs verarbeitet
                  {processingStatus.new_invoices > 0 && (
                    <span className="text-success ml-2">
                      • {processingStatus.new_invoices} neue Rechnungen
                    </span>
                  )}
                </div>
              </div>
            )}

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base">{t('invoices.recentInvoices', 'Hochgeladene Rechnungen')}</CardTitle>
            <div className="flex items-center gap-2">
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) => value && setViewMode(value as ViewMode)}
                className="bg-muted/50 p-1 rounded-lg"
              >
                <ToggleGroupItem value="supplier" size="sm" className="text-xs px-3 data-[state=on]:bg-background">
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  {t('invoices.bySupplier', 'Lieferant')}
                </ToggleGroupItem>
                <ToggleGroupItem value="date" size="sm" className="text-xs px-3 data-[state=on]:bg-background">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {t('invoices.byDate', 'Datum')}
                </ToggleGroupItem>
                <ToggleGroupItem value="flat" size="sm" className="text-xs px-3 data-[state=on]:bg-background">
                  <List className="h-3.5 w-3.5 mr-1.5" />
                  {t('invoices.flatList', 'Liste')}
                </ToggleGroupItem>
              </ToggleGroup>
              {viewMode !== 'flat' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => expandedGroups.size > 0 ? collapseAllGroups() : expandAllGroups()}
                  className="text-xs"
                >
                  <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
                  {expandedGroups.size > 0 ? t('common.collapseAll', 'Alle zuklappen') : t('common.expandAll', 'Alle aufklappen')}
                </Button>
              )}
            </div>
          </div>
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
          ) : viewMode === 'supplier' ? (
            // Supplier grouped view
            <div className="divide-y divide-border">
              {groupInvoicesBySupplier.map((group) => {
                const groupId = group.supplierId || 'unknown';
                const isGroupExpanded = expandedGroups.has(groupId);
                
                return (
                  <Collapsible
                    key={groupId}
                    open={isGroupExpanded}
                    onOpenChange={() => toggleGroup(groupId)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer bg-muted/20">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isGroupExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{group.supplierName}</span>
                              <Badge variant="secondary" className="text-xs">
                                {group.invoices.length} {t('invoices.invoicesCount', 'Rechnungen')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {group.pendingCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                                  {group.pendingCount} {t('invoices.pending', 'neu')}
                                </Badge>
                              )}
                              {group.discrepancyCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                                  {group.discrepancyCount} {t('invoices.withDiscrepancies', 'Abweichungen')}
                                </Badge>
                              )}
                              {group.approvedCount > 0 && (
                                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                  {group.approvedCount} {t('invoices.approved', 'freigegeben')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-lg">
                            €{group.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="divide-y divide-border border-t">
                        {group.invoices.map((invoice) => (
                          <InvoiceRow
                            key={invoice.id}
                            invoice={invoice}
                            isExpanded={expandedInvoices.has(invoice.id)}
                            onToggle={() => toggleExpanded(invoice.id)}
                            locale={locale}
                            onOpenPdf={openPdfViewer}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onReanalyze={handleReanalyze}
                            onDelete={setDeletingInvoice}
                            onCreateArticles={(invoiceId, supplierId) => 
                              createArticlesFromInvoice.mutate({ invoiceId, supplierId })
                            }
                            isPending={{
                              update: updateStatus.isPending,
                              reanalyze: reanalyzeInvoice.isPending,
                              createArticles: createArticlesFromInvoice.isPending,
                            }}
                            showSupplierName={false}
                            t={t}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : viewMode === 'date' ? (
            // Date grouped view
            <div className="divide-y divide-border">
              {groupInvoicesByMonth.map((group) => {
                const isGroupExpanded = expandedGroups.has(group.monthKey);
                
                return (
                  <Collapsible
                    key={group.monthKey}
                    open={isGroupExpanded}
                    onOpenChange={() => toggleGroup(group.monthKey)}
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer bg-muted/20">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {isGroupExpanded ? (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold capitalize">{group.monthLabel}</span>
                              <Badge variant="secondary" className="text-xs">
                                {group.invoices.length} {t('invoices.invoicesCount', 'Rechnungen')}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-lg">
                            €{group.totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="divide-y divide-border border-t">
                        {group.invoices.map((invoice) => (
                          <InvoiceRow
                            key={invoice.id}
                            invoice={invoice}
                            isExpanded={expandedInvoices.has(invoice.id)}
                            onToggle={() => toggleExpanded(invoice.id)}
                            locale={locale}
                            onOpenPdf={openPdfViewer}
                            onApprove={handleApprove}
                            onReject={handleReject}
                            onReanalyze={handleReanalyze}
                            onDelete={setDeletingInvoice}
                            onCreateArticles={(invoiceId, supplierId) => 
                              createArticlesFromInvoice.mutate({ invoiceId, supplierId })
                            }
                            isPending={{
                              update: updateStatus.isPending,
                              reanalyze: reanalyzeInvoice.isPending,
                              createArticles: createArticlesFromInvoice.isPending,
                            }}
                            showSupplierName={true}
                            t={t}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            // Flat view (original)
            <div className="divide-y divide-border">
              {invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  isExpanded={expandedInvoices.has(invoice.id)}
                  onToggle={() => toggleExpanded(invoice.id)}
                  locale={locale}
                  onOpenPdf={openPdfViewer}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onReanalyze={handleReanalyze}
                  onDelete={setDeletingInvoice}
                  onCreateArticles={(invoiceId, supplierId) => 
                    createArticlesFromInvoice.mutate({ invoiceId, supplierId })
                  }
                  isPending={{
                    update: updateStatus.isPending,
                    reanalyze: reanalyzeInvoice.isPending,
                    createArticles: createArticlesFromInvoice.isPending,
                  }}
                  showSupplierName={true}
                  t={t}
                />
              ))}
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
            <DialogDescription className="sr-only">
              {t('invoices.pdfPreviewDescription', 'PDF-Dokument der Rechnung')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {pdfDialogUrl && !pdfViewerError && (
              <PdfCanvasViewer
                pdfUrl={pdfDialogUrl}
                onError={(err) => setPdfViewerError(err)}
              />
            )}
            
            {/* Error state with fallback buttons */}
            {pdfViewerError && (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-muted/30">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  {t('invoices.pdfNotSupported', 'PDF-Vorschau nicht verfügbar')}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {pdfViewerError}
                </p>
                <div className="flex gap-2">
                  <Button asChild>
                    <a href={pdfDialogUrl!} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      {t('invoices.openInNewTab', 'Neuer Tab')}
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={pdfDialogUrl!} download>
                      <Download className="h-4 w-4 mr-2" />
                      {t('invoices.download', 'Download')}
                    </a>
                  </Button>
                </div>
              </div>
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
