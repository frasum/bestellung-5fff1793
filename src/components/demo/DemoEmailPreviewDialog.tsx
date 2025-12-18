import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, CheckCircle2, Send, Building2, MapPin, Package } from 'lucide-react';

export interface DemoEmailPreviewItem {
  articleName: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface DemoEmailPreviewData {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  deliveryAddress: string;
  items: DemoEmailPreviewItem[];
  totalAmount: number;
  notes: string;
  confirmed: boolean;
}

interface DemoEmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailPreviews: DemoEmailPreviewData[];
  onUpdateNotes: (supplierId: string, notes: string) => void;
  onToggleConfirm: (supplierId: string) => void;
  onSendOrders: () => void;
  isOrdering: boolean;
  industry: {
    terminology: {
      supplier: string;
      supplierPlural: string;
    };
  };
}

export function DemoEmailPreviewDialog({
  open,
  onOpenChange,
  emailPreviews,
  onUpdateNotes,
  onToggleConfirm,
  onSendOrders,
  isOrdering,
  industry,
}: DemoEmailPreviewDialogProps) {
  const allConfirmed = emailPreviews.every(preview => preview.confirmed);
  const confirmedCount = emailPreviews.filter(preview => preview.confirmed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            E-Mail-Vorschau ({confirmedCount}/{emailPreviews.length} bestätigt)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Bitte kontrollieren Sie die E-Mails an Ihre {industry.terminology.supplierPlural} und bestätigen Sie jede einzeln.
          </p>

          {emailPreviews.map((preview, index) => (
            <Card 
              key={preview.supplierId} 
              className={`transition-all ${preview.confirmed ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {preview.supplierName}
                  </CardTitle>
                  {preview.confirmed && (
                    <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Bestätigt
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {preview.supplierEmail}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Preview Content */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                  <div className="font-medium">
                    Betreff: Bestellung von Demo-Betrieb GmbH
                  </div>
                  <Separator />
                  <div>
                    <p>Sehr geehrte Damen und Herren,</p>
                    <p className="mt-2">hiermit bestellen wir folgende Artikel:</p>
                  </div>

                  {/* Items Table */}
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Artikel</th>
                          <th className="text-right p-2">Menge</th>
                          <th className="text-right p-2">Preis</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.articleName}</td>
                            <td className="text-right p-2">{item.quantity} {item.unit}</td>
                            <td className="text-right p-2">€{(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="border-t font-medium bg-muted/50">
                          <td className="p-2" colSpan={2}>Gesamtsumme</td>
                          <td className="text-right p-2">€{preview.totalAmount.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Delivery Address */}
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">Lieferadresse:</span>
                      <pre className="text-xs mt-1 whitespace-pre-wrap">{preview.deliveryAddress}</pre>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Notizen an {preview.supplierName}:
                  </label>
                  <Textarea
                    placeholder="Optional: Zusätzliche Hinweise für diese Bestellung..."
                    value={preview.notes}
                    onChange={(e) => onUpdateNotes(preview.supplierId, e.target.value)}
                    rows={2}
                    disabled={preview.confirmed}
                  />
                </div>

                {/* Confirmation Checkbox */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id={`confirm-${preview.supplierId}`}
                    checked={preview.confirmed}
                    onCheckedChange={() => onToggleConfirm(preview.supplierId)}
                  />
                  <label
                    htmlFor={`confirm-${preview.supplierId}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    E-Mail an {preview.supplierName} bestätigen
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isOrdering}>
            Abbrechen
          </Button>
          <Button
            onClick={onSendOrders}
            disabled={!allConfirmed || isOrdering}
            className="gap-2"
          >
            {isOrdering ? (
              'Wird gesendet...'
            ) : (
              <>
                <Send className="w-4 h-4" />
                {emailPreviews.length} {emailPreviews.length === 1 ? 'E-Mail' : 'E-Mails'} senden
              </>
            )}
          </Button>
        </DialogFooter>

        {!allConfirmed && (
          <p className="text-xs text-muted-foreground text-center">
            Bitte bestätigen Sie alle E-Mails, bevor Sie die Demo-Bestellungen senden.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
