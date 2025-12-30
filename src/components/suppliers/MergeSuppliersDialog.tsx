import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowRight, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';
import { useMergeSuppliers } from '@/hooks/useMergeSuppliers';

interface MergeSuppliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  articles: Article[];
}

export function MergeSuppliersDialog({
  open,
  onOpenChange,
  suppliers,
  articles,
}: MergeSuppliersDialogProps) {
  const { t } = useTranslation();
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  
  const mergeSuppliers = useMergeSuppliers();

  // Calculate article counts per supplier
  const articleCountBySupplier = useMemo(() => {
    const counts: Record<string, number> = {};
    articles?.forEach(article => {
      counts[article.supplier_id] = (counts[article.supplier_id] || 0) + 1;
    });
    return counts;
  }, [articles]);

  // Get source and target supplier objects
  const sourceSupplier = suppliers.find(s => s.id === sourceId);
  const targetSupplier = suppliers.find(s => s.id === targetId);
  
  // Calculate affected articles count
  const sourceArticleCount = articleCountBySupplier[sourceId] || 0;
  const targetArticleCount = articleCountBySupplier[targetId] || 0;
  const totalArticlesAfterMerge = sourceArticleCount + targetArticleCount;

  // Filter out selected supplier from other dropdown
  const availableSourceSuppliers = suppliers.filter(s => s.id !== targetId);
  const availableTargetSuppliers = suppliers.filter(s => s.id !== sourceId);

  const handleMerge = async () => {
    if (!sourceId || !targetId) return;
    
    await mergeSuppliers.mutateAsync({ sourceId, targetId });
    
    // Reset state and close dialog
    setSourceId('');
    setTargetId('');
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSourceId('');
      setTargetId('');
    }
    onOpenChange(open);
  };

  const canMerge = sourceId && targetId && sourceId !== targetId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lieferanten zusammenführen</DialogTitle>
          <DialogDescription>
            Wählen Sie den Quell-Lieferanten (wird gelöscht) und den Ziel-Lieferanten (bleibt erhalten).
            Alle verknüpften Daten werden übertragen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Supplier Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quell-Lieferant (wird gelöscht)
            </label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Lieferant auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableSourceSuppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} ({articleCountBySupplier[supplier.id] || 0} Artikel)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Arrow indicator */}
          {sourceId && (
            <div className="flex items-center justify-center text-muted-foreground">
              <ArrowRight className="w-5 h-5" />
            </div>
          )}

          {/* Target Supplier Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Ziel-Lieferant (bleibt erhalten)
            </label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Lieferant auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableTargetSuppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name} ({articleCountBySupplier[supplier.id] || 0} Artikel)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview of changes */}
          {canMerge && (
            <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong>{sourceSupplier?.name}</strong> wird in <strong>{targetSupplier?.name}</strong> überführt.
                <br />
                <span className="text-muted-foreground">
                  {sourceArticleCount} Artikel werden verschoben. 
                  Nach der Zusammenführung: {totalArticlesAfterMerge} Artikel.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleMerge}
            disabled={!canMerge || mergeSuppliers.isPending}
          >
            {mergeSuppliers.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Zusammenführen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
