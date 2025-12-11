import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Check, X, Loader2, ArrowRight } from 'lucide-react';
import { 
  usePendingChangesBySupplier, 
  useApproveChange, 
  useRejectChange,
  useApproveAllChanges,
  useRejectAllChanges 
} from '@/hooks/useSupplierChanges';
import { useSuggestedArticlesBySupplier } from '@/hooks/useSuggestedArticles';
import { SuggestedArticlesSection } from './SuggestedArticlesSection';

interface SupplierChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string | null;
  supplierName: string;
  articleId?: string | null;
  articleName?: string;
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
  supplierName,
  articleId,
  articleName
}: SupplierChangesDialogProps) => {
  const { data: allChanges, isLoading: changesLoading } = usePendingChangesBySupplier(supplierId);
  const { data: suggestions, isLoading: suggestionsLoading } = useSuggestedArticlesBySupplier(supplierId);
  const approveChange = useApproveChange();
  const rejectChange = useRejectChange();
  const approveAll = useApproveAllChanges();
  const rejectAll = useRejectAllChanges();

  // Filter changes by articleId if provided
  const changes = articleId 
    ? allChanges?.filter(c => c.article_id === articleId) 
    : allChanges;

  const isLoading = changesLoading || suggestionsLoading;

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

  const hasChanges = (changes?.length || 0) > 0;
  const hasSuggestions = (suggestions?.length || 0) > 0;
  const isEmpty = !hasChanges && !hasSuggestions;

  // Determine dialog title based on whether filtering by article
  const dialogTitle = articleId && articleName 
    ? `Änderungen - ${articleName}` 
    : `Ausstehende Änderungen - ${supplierName}`;

  const dialogDescription = articleId 
    ? 'Überprüfen Sie die Änderungen für diesen Artikel'
    : 'Überprüfen Sie die vom Lieferanten vorgeschlagenen Änderungen und Artikel';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-8 text-muted-foreground">
            Keine ausstehenden Änderungen oder Vorschläge
          </div>
        ) : (
          <div className="space-y-6">
            {/* Suggested Articles Section */}
            {hasSuggestions && (
              <>
                <SuggestedArticlesSection 
                  suggestions={suggestions || []} 
                  isProcessing={isProcessing}
                />
                {hasChanges && <Separator />}
              </>
            )}

            {/* Article Changes Section */}
            {hasChanges && (
              <>
                {/* Bulk actions for changes */}
                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => rejectAll.mutate(allChangeIds)}
                    disabled={isProcessing}
                    className="w-full sm:w-auto h-10 sm:h-9"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Alle ablehnen
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveAll.mutate(allChangeIds)}
                    disabled={isProcessing}
                    className="w-full sm:w-auto h-10 sm:h-9"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Alle übernehmen
                  </Button>
                </div>

                {/* Changes by article */}
                {Object.entries(groupedChanges).map(([articleId, { articleName, changes: articleChanges }]) => (
                  <div key={articleId} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted px-4 py-2 font-medium text-sm sm:text-base">
                      {articleName}
                    </div>
                    
                    {/* Mobile Card View */}
                    <div className="sm:hidden p-3 space-y-3">
                      {articleChanges.map((change) => (
                        <div key={change.id} className="p-3 bg-muted/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">
                              {FIELD_LABELS[change.field_name] || change.field_name}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-destructive hover:text-destructive"
                                onClick={() => rejectChange.mutate(change.id)}
                                disabled={isProcessing}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-green-600 hover:text-green-600"
                                onClick={() => approveChange.mutate(change.id)}
                                disabled={isProcessing}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground line-through">{change.old_value || '-'}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium">{change.new_value || '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="hidden sm:block">
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
                                <Badge variant="outline">
                                  {FIELD_LABELS[change.field_name] || change.field_name}
                                </Badge>
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
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
