import { useState, useCallback, useEffect, useMemo } from 'react';
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
  Building2,
  Calendar,
  List,
  ChevronsUpDown,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PdfCanvasViewer } from './PdfCanvasViewer';
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
  useInvoiceProcessingStatus,
  Invoice,
  InvoiceDiscrepancy,
} from '@/hooks/useInvoices';
import { Progress } from '@/components/ui/progress';
import { InvoiceProcessingSummary } from './InvoiceProcessingSummary';

type ViewMode = 'supplier' | 'date' | 'flat';

interface SupplierGroup {
  supplierId: string | null;
  supplierName: string;
  invoices: Invoice[];
  totalAmount: number;
  pendingCount: number;
  approvedCount: number;
  discrepancyCount: number;
}

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  invoices: Invoice[];
  totalAmount: number;
}

const statusConfig: Record<Invoice['status'], { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'bg-muted text-muted-foreground', label: 'Neu' },
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
  const { status: processingStatus, isProcessing, progress } = useInvoiceProcessingStatus();
  
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
  const reanalyzeInvoice = useReanalyzeInvoice();
  const createArticlesFromInvoice = useCreateArticlesFromInvoice();
  const deleteInvoice = useDeleteInvoice();
  
  const locale = i18n.language === 'de' ? de : enUS;
  
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('supplier');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pdfDialogUrl, setPdfDialogUrl] = useState<string | null>(null);

  // Grouping functions
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
    
    // Sort groups by supplier name, sort invoices within by date (newest first)
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
    
    // Sort groups by month (newest first), sort invoices within by supplier name
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
  const [pdfViewerError, setPdfViewerError] = useState<string | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

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

// Invoice row component for reuse in different views
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
  t: ReturnType<typeof useTranslation>['t'];
}

function InvoiceRow({
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
  const StatusIcon = statusConfig[invoice.status].icon;
  const discrepancyCount = invoice.invoice_discrepancies?.filter(d => !d.is_resolved).length || 0;

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
                <Badge variant="outline" className={cn('text-xs', statusConfig[invoice.status].color)}>
                  <StatusIcon className={cn('h-3 w-3 mr-1', invoice.status === 'processing' && 'animate-spin')} />
                  {statusConfig[invoice.status].label}
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
