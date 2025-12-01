import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import { 
  usePendingChangesBySupplier, 
  useApproveChange, 
  useRejectChange,
  useApproveAllChanges,
  useRejectAllChanges 
} from '@/hooks/useSupplierChanges';
import { PriceHistoryPopover } from './PriceHistoryPopover';

interface SupplierChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string | null;
  supplierName: string;
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  sku: 'SKU',
  description: 'Beschreibung',
  unit: 'Einheit',
  price: 'Preis',
  category: 'Kategorie',
};

export const SupplierChangesDialog = ({ 
  open, 
  onOpenChange, 
  supplierId, 
  supplierName 
}: SupplierChangesDialogProps) => {
  const { data: changes, isLoading } = usePendingChangesBySupplier(supplierId);
  const approveChange = useApproveChange();
  const rejectChange = useRejectChange();
  const approveAll = useApproveAllChanges();
  const rejectAll = useRejectAllChanges();

  // Group changes by article
  const groupedChanges = changes?.reduce((acc, change) => {
    if (!acc[change.article_id]) {
      acc[change.article_id] = {
        articleName: change.articles?.name || 'Unbekannt',
        changes: [],
      };
    }
    acc[change.article_id].changes.push(change);
    return acc;
  }, {} as Record<string, { articleName: string; changes: typeof changes }>) || {};

  const allChangeIds = changes?.map(c => c.id) || [];
  const isProcessing = approveChange.isPending || rejectChange.isPending || 
                       approveAll.isPending || rejectAll.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ausstehende Änderungen - {supplierName}</DialogTitle>
          <DialogDescription>
            Überprüfen Sie die vom Lieferanten vorgeschlagenen Änderungen
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !changes?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine ausstehenden Änderungen
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bulk actions */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => rejectAll.mutate(allChangeIds)}
                disabled={isProcessing}
              >
                <X className="h-4 w-4 mr-1" />
                Alle ablehnen
              </Button>
              <Button
                size="sm"
                onClick={() => approveAll.mutate(allChangeIds)}
                disabled={isProcessing}
              >
                <Check className="h-4 w-4 mr-1" />
                Alle übernehmen
              </Button>
            </div>

            {/* Changes by article */}
            {Object.entries(groupedChanges).map(([articleId, { articleName, changes: articleChanges }]) => (
              <div key={articleId} className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium">
                  {articleName}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Feld</TableHead>
                      <TableHead>Alter Wert</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Neuer Wert</TableHead>
                      <TableHead className="w-[120px]">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articleChanges.map((change) => (
                      <TableRow key={change.id}>
                                        <TableCell>
                                          <div className="flex items-center gap-1">
                                            <Badge variant="outline">
                                              {FIELD_LABELS[change.field_name] || change.field_name}
                                            </Badge>
                                            {change.field_name === 'price' && (
                                              <PriceHistoryPopover 
                                                articleId={change.article_id} 
                                                articleName={change.articles?.name || 'Artikel'} 
                                              />
                                            )}
                                          </div>
                                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {change.old_value || '-'}
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">
                          {change.new_value || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => rejectChange.mutate(change.id)}
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-600"
                              onClick={() => approveChange.mutate(change.id)}
                              disabled={isProcessing}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
