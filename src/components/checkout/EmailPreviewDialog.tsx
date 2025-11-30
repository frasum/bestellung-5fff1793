import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader2, ChevronLeft, ChevronRight, Pencil, Check } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

export interface EmailPreviewData {
  supplierName: string;
  supplierEmail: string;
  restaurantName: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
}

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emailPreviews: EmailPreviewData[];
  onEmailPreviewsChange: (previews: EmailPreviewData[]) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export const EmailPreviewDialog = ({
  open,
  onOpenChange,
  emailPreviews,
  onEmailPreviewsChange,
  onConfirm,
  isSubmitting,
}: EmailPreviewDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const currentEmail = emailPreviews[currentIndex];

  if (!currentEmail) return null;

  const goNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, emailPreviews.length - 1));
    setIsEditingNotes(false);
    setIsEditingAddress(false);
  };
  const goPrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setIsEditingNotes(false);
    setIsEditingAddress(false);
  };

  const updateCurrentEmail = (updates: Partial<EmailPreviewData>) => {
    const newPreviews = [...emailPreviews];
    newPreviews[currentIndex] = { ...newPreviews[currentIndex], ...updates };
    onEmailPreviewsChange(newPreviews);
  };

  const updateAllEmails = (updates: Partial<EmailPreviewData>) => {
    const newPreviews = emailPreviews.map(preview => ({ ...preview, ...updates }));
    onEmailPreviewsChange(newPreviews);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            E-Mail Vorschau
            {emailPreviews.length > 1 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({currentIndex + 1} von {emailPreviews.length})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: 'calc(80vh - 180px)' }}>
          <div className="space-y-4">
            {/* Email Header */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">An:</span>
                <span className="font-medium">{currentEmail.supplierEmail}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">Von:</span>
                <span>ProcureResto &lt;onboarding@resend.dev&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">Betreff:</span>
                <span className="font-medium">Neue Bestellung von {currentEmail.restaurantName}</span>
              </div>
            </div>

            {/* Email Body Preview */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-primary px-6 py-4">
                <h2 className="text-primary-foreground text-xl font-semibold">Neue Bestellung erhalten</h2>
                <p className="text-primary-foreground/80 text-sm mt-1">Bestellung wird generiert...</p>
              </div>

              <div className="p-6 space-y-6 bg-card">
                {/* Order Details */}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Bestelldetails</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">Von:</span> {currentEmail.restaurantName}</p>
                    <p><span className="font-medium">An:</span> {currentEmail.supplierName}</p>
                    <p><span className="font-medium">Datum:</span> {format(new Date(), 'PPP', { locale: de })}</p>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">Lieferadresse</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingAddress(!isEditingAddress)}
                      className="h-7 px-2"
                    >
                      {isEditingAddress ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </Button>
                  </div>
                  {isEditingAddress ? (
                    <div className="space-y-2">
                      <Textarea
                        value={currentEmail.deliveryAddress}
                        onChange={(e) => updateCurrentEmail({ deliveryAddress: e.target.value })}
                        rows={4}
                        className="text-sm"
                      />
                      {emailPreviews.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateAllEmails({ deliveryAddress: currentEmail.deliveryAddress });
                            setIsEditingAddress(false);
                          }}
                        >
                          Für alle Bestellungen übernehmen
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {currentEmail.deliveryAddress}
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">📝 Notizen</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                      className="h-7 px-2"
                    >
                      {isEditingNotes ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                    </Button>
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={currentEmail.notes || ''}
                        onChange={(e) => updateCurrentEmail({ notes: e.target.value })}
                        rows={4}
                        placeholder="Notizen hinzufügen..."
                        className="text-sm"
                      />
                      {emailPreviews.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateAllEmails({ notes: currentEmail.notes });
                            setIsEditingNotes(false);
                          }}
                        >
                          Für alle Bestellungen übernehmen
                        </Button>
                      )}
                    </div>
                  ) : currentEmail.notes ? (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                      <p className="text-sm text-warning-foreground/80 whitespace-pre-line">
                        {currentEmail.notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Keine Notizen - Klicke auf den Stift um welche hinzuzufügen
                    </p>
                  )}
                </div>

                {/* Items Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold">Artikel</th>
                        <th className="text-center p-3 font-semibold">Menge</th>
                        <th className="text-right p-3 font-semibold">Stückpreis</th>
                        <th className="text-right p-3 font-semibold">Gesamt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {currentEmail.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3">{item.article_name}</td>
                          <td className="p-3 text-center">{item.quantity} {item.unit}</td>
                          <td className="p-3 text-right">€{item.unit_price.toFixed(2)}</td>
                          <td className="p-3 text-right font-medium">€{item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-primary text-primary-foreground">
                        <td colSpan={3} className="p-3 font-semibold">Gesamtbetrag</td>
                        <td className="p-3 text-right font-bold text-lg">€{currentEmail.totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          {emailPreviews.length > 1 && (
            <div className="flex gap-2 mr-auto">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Vorherige
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={currentIndex === emailPreviews.length - 1}>
                Nächste
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sende Bestellungen...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {emailPreviews.length} Bestellung{emailPreviews.length > 1 ? 'en' : ''} absenden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
