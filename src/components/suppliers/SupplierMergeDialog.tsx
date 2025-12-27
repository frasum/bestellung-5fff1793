import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowRight, AlertTriangle, Package, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Supplier } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';

interface SupplierMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  articlesBySupplier: Record<string, Article[]>;
  onSuccess: () => void;
}

export const SupplierMergeDialog = ({
  open,
  onOpenChange,
  suppliers,
  articlesBySupplier,
  onSuccess,
}: SupplierMergeDialogProps) => {
  const { t } = useTranslation();
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [syncingPrices, setSyncingPrices] = useState(false);

  const sourceSupplier = useMemo(() => suppliers.find(s => s.id === sourceId), [suppliers, sourceId]);
  const targetSupplier = useMemo(() => suppliers.find(s => s.id === targetId), [suppliers, targetId]);

  const sourceArticleCount = sourceId ? (articlesBySupplier[sourceId]?.length || 0) : 0;
  const targetArticleCount = targetId ? (articlesBySupplier[targetId]?.length || 0) : 0;

  // Calculate what data would be transferred
  const dataTransfer = useMemo(() => {
    if (!sourceSupplier || !targetSupplier) return null;
    
    const transfers: string[] = [];
    
    if (sourceSupplier.phone && !targetSupplier.phone) {
      transfers.push(`Telefon: ${sourceSupplier.phone}`);
    }
    if (sourceSupplier.email && (!targetSupplier.email || targetSupplier.email.includes('.auto'))) {
      transfers.push(`E-Mail: ${sourceSupplier.email}`);
    }
    if (sourceSupplier.address && !targetSupplier.address) {
      transfers.push(`Adresse: ${sourceSupplier.address}`);
    }
    
    return transfers;
  }, [sourceSupplier, targetSupplier]);

  const handleMerge = async () => {
    if (!sourceId || !targetId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('merge-suppliers', {
        body: { sourceId, targetId, deleteSource: true },
      });

      if (error) throw error;

      toast.success(`${data.articlesMoved} Artikel von "${data.sourceSupplier}" zu "${data.targetSupplier}" verschoben`);
      onSuccess();
      onOpenChange(false);
      setSourceId('');
      setTargetId('');
    } catch (error: any) {
      console.error('Merge error:', error);
      toast.error('Fehler beim Zusammenführen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPrices = async () => {
    setSyncingPrices(true);
    try {
      // First do a dry run
      const { data: dryRunData, error: dryRunError } = await supabase.functions.invoke('update-article-prices', {
        body: { supplierId: targetId || undefined, dryRun: true },
      });

      if (dryRunError) throw dryRunError;

      if (dryRunData.potentialUpdates === 0) {
        toast.info('Keine Artikel mit fehlenden Preisen gefunden');
        return;
      }

      // Show confirmation and proceed
      const { data, error } = await supabase.functions.invoke('update-article-prices', {
        body: { supplierId: targetId || undefined, dryRun: false },
      });

      if (error) throw error;

      toast.success(`${data.updatedCount} Artikel-Preise aus Rechnungen aktualisiert`);
      onSuccess();
    } catch (error: any) {
      console.error('Price sync error:', error);
      toast.error('Fehler bei Preis-Synchronisierung: ' + error.message);
    } finally {
      setSyncingPrices(false);
    }
  };

  const availableTargets = suppliers.filter(s => s.id !== sourceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lieferanten zusammenführen</DialogTitle>
          <DialogDescription>
            Verschiebe alle Artikel von einem Lieferanten zu einem anderen und lösche den Quell-Lieferanten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Supplier */}
          <div className="space-y-2">
            <Label>Quell-Lieferant (wird gelöscht)</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Lieferant auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{supplier.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({articlesBySupplier[supplier.id]?.length || 0} Artikel)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Arrow */}
          {sourceId && (
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          {/* Target Supplier */}
          <div className="space-y-2">
            <Label>Ziel-Lieferant (behält alle Daten)</Label>
            <Select value={targetId} onValueChange={setTargetId} disabled={!sourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Ziel-Lieferant auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{supplier.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({articlesBySupplier[supplier.id]?.length || 0} Artikel)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {sourceSupplier && targetSupplier && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              <h4 className="font-medium text-sm">Vorschau der Änderungen:</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{sourceArticleCount} Artikel werden verschoben</span>
              </div>

              {dataTransfer && dataTransfer.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Kontaktdaten werden übernommen:</span>
                  {dataTransfer.map((item, i) => (
                    <div key={i} className="text-sm flex items-center gap-2">
                      {item.includes('Telefon') && <Phone className="h-3 w-3" />}
                      {item.includes('E-Mail') && <Mail className="h-3 w-3" />}
                      {item.includes('Adresse') && <MapPin className="h-3 w-3" />}
                      {item}
                    </div>
                  ))}
                </div>
              )}

              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  "{sourceSupplier.name}" wird nach dem Zusammenführen gelöscht.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSyncPrices}
            disabled={syncingPrices || loading}
            className="sm:mr-auto"
          >
            {syncingPrices ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preise werden aktualisiert...
              </>
            ) : (
              'Preise aus Rechnungen aktualisieren'
            )}
          </Button>
          
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Abbrechen
          </Button>
          
          <Button 
            onClick={handleMerge} 
            disabled={!sourceId || !targetId || loading}
            variant="destructive"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Zusammenführen...
              </>
            ) : (
              'Zusammenführen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
