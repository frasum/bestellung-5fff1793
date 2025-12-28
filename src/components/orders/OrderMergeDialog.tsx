import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Merge, ArrowRight, Package, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS, fr } from 'date-fns/locale';
import { Order } from '@/hooks/useOrders';
import { useMergeOrders } from '@/hooks/useMergeOrders';
import { cn } from '@/lib/utils';

const localeMap: Record<string, typeof de> = { de, en: enUS, fr };

interface OrderMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  onSuccess?: () => void;
}

export function OrderMergeDialog({
  open,
  onOpenChange,
  orders,
  onSuccess,
}: OrderMergeDialogProps) {
  const { t, i18n } = useTranslation();
  const locale = localeMap[i18n.language] || de;
  const [combineNotes, setCombineNotes] = useState(true);
  const mergeOrders = useMergeOrders();

  // Target = newest order (by created_at)
  const { targetOrder, sourceOrders } = useMemo(() => {
    if (orders.length < 2) return { targetOrder: null, sourceOrders: [] };
    
    const sorted = [...orders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return {
      targetOrder: sorted[0],
      sourceOrders: sorted.slice(1),
    };
  }, [orders]);

  // Calculate merged totals
  const mergedStats = useMemo(() => {
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalItems = orders.reduce((sum, o) => sum + (o.order_items?.length || 0), 0);
    const allNotes = orders
      .filter(o => o.notes)
      .map(o => o.notes!)
      .join('\n---\n');
    
    return { totalAmount, totalItems, allNotes };
  }, [orders]);

  // Check if all orders are from same supplier
  const sameSupplier = useMemo(() => {
    if (orders.length < 2) return true;
    const supplierId = orders[0].supplier_id;
    return orders.every(o => o.supplier_id === supplierId);
  }, [orders]);

  const handleMerge = async () => {
    if (!targetOrder || sourceOrders.length === 0) return;

    try {
      await mergeOrders.mutateAsync({
        targetOrderId: targetOrder.id,
        sourceOrderIds: sourceOrders.map(o => o.id),
        combineNotes,
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Merge failed:', error);
    }
  };

  if (!targetOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            Bestellungen zusammenführen
          </DialogTitle>
          <DialogDescription>
            {orders.length} Bestellungen von {targetOrder.suppliers?.name} werden zu einer zusammengeführt.
          </DialogDescription>
        </DialogHeader>

        {!sameSupplier && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-sm">
              Die Bestellungen müssen vom selben Lieferanten sein!
            </span>
          </div>
        )}

        <div className="space-y-4">
          {/* Source Orders */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Diese Bestellungen werden zusammengeführt:
            </span>
            <div className="space-y-2">
              {sourceOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{order.order_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(order.created_at), 'd. MMM HH:mm', { locale })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {order.order_items?.length || 0} Art.
                    </Badge>
                    <span className="text-sm font-medium">
                      €{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
          </div>

          {/* Target Order */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Ziel-Bestellung (neueste):
            </span>
            <div className="p-3 bg-primary/10 rounded-lg border-2 border-primary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium">{targetOrder.order_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(targetOrder.created_at), 'd. MMM HH:mm', { locale })}
                  </span>
                </div>
                <Badge variant="default" className="text-xs">
                  Ziel
                </Badge>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-card border border-border rounded-lg space-y-2">
            <span className="text-sm font-medium">Nach dem Zusammenführen:</span>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Artikel gesamt:</span>
              <span className="font-medium">{mergedStats.totalItems}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Gesamtbetrag:</span>
              <span className="font-bold text-lg">€{mergedStats.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Combine Notes Option */}
          {mergedStats.allNotes && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="combineNotes"
                checked={combineNotes}
                onCheckedChange={(checked) => setCombineNotes(checked === true)}
              />
              <label
                htmlFor="combineNotes"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Notizen zusammenführen
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!sameSupplier || mergeOrders.isPending}
          >
            {mergeOrders.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Merge className="w-4 h-4 mr-2" />
            )}
            Zusammenführen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
