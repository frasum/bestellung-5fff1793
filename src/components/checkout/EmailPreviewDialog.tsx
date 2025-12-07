import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Mail, Send, Loader2, ChevronLeft, ChevronRight, Pencil, Check, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useEmailTemplate, getDefaultTemplate } from '@/hooks/useEmailTemplates';
import { useOrganization } from '@/hooks/useSettings';

interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sku?: string;
}

export interface EmailPreviewData {
  supplierName: string;
  supplierEmail: string;
  restaurantName: string;
  deliveryAddress: string;
  items: OrderItem[];
  totalAmount: number;
  notes?: string;
  customerNumber?: string;
  isTestMode?: boolean;
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
  const [confirmedEmails, setConfirmedEmails] = useState<Set<number>>(new Set());
  const { data: emailTemplate } = useEmailTemplate();
  const { data: organization } = useOrganization();
  const defaultTemplate = getDefaultTemplate();
  const currentEmail = emailPreviews[currentIndex];
  const advancedViewEnabled = organization?.advanced_view_enabled || false;

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmedEmails(new Set());
      setCurrentIndex(0);
      setIsEditingNotes(false);
      setIsEditingAddress(false);
    }
  }, [open]);

  // Check if all emails are confirmed (or advanced view is disabled)
  const allEmailsConfirmed = !advancedViewEnabled || confirmedEmails.size === emailPreviews.length;

  // Toggle current email confirmation
  const toggleCurrentEmailConfirmed = () => {
    setConfirmedEmails(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  if (!currentEmail) return null;

  // Get template values (use saved or defaults)
  const template = {
    subject_template: emailTemplate?.subject_template || defaultTemplate.subject_template || '',
    greeting: emailTemplate?.greeting || defaultTemplate.greeting || '',
    introduction: emailTemplate?.introduction || defaultTemplate.introduction || '',
    closing: emailTemplate?.closing || defaultTemplate.closing || '',
    signature: emailTemplate?.signature || defaultTemplate.signature || '',
    article_list_format: emailTemplate?.article_list_format || defaultTemplate.article_list_format || '- {article_name}{sku_suffix}: {quantity} {unit} à €{unit_price} = €{total_price}',
  };

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

  const generateEmailSubject = (email: EmailPreviewData) => {
    const customerNumberSuffix = email.customerNumber ? ` (Kd-Nr: ${email.customerNumber})` : '';
    return template.subject_template
      .replace('{restaurant_name}', email.restaurantName)
      .replace('{customer_number_suffix}', customerNumberSuffix);
  };

  const generateEmailBody = (email: EmailPreviewData) => {
    const itemsList = email.items
      .map(item => {
        const skuSuffix = item.sku ? ` (SKU: ${item.sku})` : '';
        return template.article_list_format
          .replace('{article_name}', item.article_name)
          .replace('{sku_suffix}', skuSuffix)
          .replace('{quantity}', item.quantity.toString())
          .replace('{unit}', item.unit)
          .replace('{unit_price}', item.unit_price.toFixed(2))
          .replace('{total_price}', item.total_price.toFixed(2));
      })
      .join('\n');

    const signatureText = template.signature.replace('{restaurant_name}', email.restaurantName);

    return `${template.greeting}

${template.introduction}

Bestelldetails:
Von: ${email.restaurantName}
An: ${email.supplierName}
Datum: ${format(new Date(), 'PPP', { locale: de })}

Lieferadresse:
${email.deliveryAddress}

${email.notes ? `Notizen:\n${email.notes}\n\n` : ''}Bestellte Artikel:
${itemsList}

Gesamtbetrag: €${email.totalAmount.toFixed(2)}

${template.closing}

${signatureText}`;
  };

  const generateMailtoLink = (email: EmailPreviewData) => {
    const subject = generateEmailSubject(email);
    const body = generateEmailBody(email);
    return `mailto:${email.supplierEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleOpenInEmailClient = () => {
    const mailtoLink = generateMailtoLink(currentEmail);
    window.open(mailtoLink, '_blank');
    toast.success(`E-Mail an ${currentEmail.supplierName} wird geöffnet`);
  };

  const handleOpenAllInEmailClient = () => {
    emailPreviews.forEach((email, index) => {
      setTimeout(() => {
        const mailtoLink = generateMailtoLink(email);
        window.open(mailtoLink, '_blank');
      }, index * 500); // Delay to prevent browser blocking
    });
    toast.success(`${emailPreviews.length} E-Mail(s) werden geöffnet`);
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
                ({currentIndex + 1} von {emailPreviews.length}{advancedViewEnabled ? ` | ${confirmedEmails.size}/${emailPreviews.length} geprüft` : ''})
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
                <span className="font-medium">
                  {generateEmailSubject(currentEmail)}
                </span>
              </div>
            </div>

            {/* Confirmation Checkbox - only shown when advanced view is enabled */}
            {advancedViewEnabled && (
              <div 
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  confirmedEmails.has(currentIndex) 
                    ? 'border-green-500/50 bg-green-500/10' 
                    : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                }`}
                onClick={toggleCurrentEmailConfirmed}
              >
                <Checkbox 
                  id={`confirm-email-${currentIndex}`}
                  checked={confirmedEmails.has(currentIndex)}
                  onCheckedChange={toggleCurrentEmailConfirmed}
                  className="h-5 w-5"
                />
                <Label 
                  htmlFor={`confirm-email-${currentIndex}`} 
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  E-Mail an {currentEmail.supplierName} geprüft
                </Label>
                {confirmedEmails.has(currentIndex) && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Bestätigt</span>
                )}
              </div>
            )}

            {/* Email Body Preview */}
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Header */}
              <div className="bg-primary px-6 py-4">
                <h2 className="text-primary-foreground text-xl font-semibold">{generateEmailSubject(currentEmail)}</h2>
                <p className="text-primary-foreground/80 text-sm mt-1">{template.greeting}</p>
              </div>

              <div className="p-6 space-y-6 bg-card">
                {/* Introduction */}
                <p className="text-sm text-muted-foreground">{template.introduction}</p>

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
                          <td className="p-3">
                            <div>{item.article_name}</div>
                            {item.sku && <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>}
                          </td>
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

                {/* Closing and Signature */}
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{template.closing}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {template.signature.replace('{restaurant_name}', currentEmail.restaurantName)}
                  </p>
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
          <Button 
            variant="secondary" 
            onClick={emailPreviews.length > 1 ? handleOpenAllInEmailClient : handleOpenInEmailClient}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Per E-Mail-Programm
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isSubmitting || !allEmailsConfirmed}
            title={advancedViewEnabled && !allEmailsConfirmed ? `Bitte alle ${emailPreviews.length} E-Mails prüfen` : undefined}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sende Bestellungen...
              </>
            ) : advancedViewEnabled && !allEmailsConfirmed ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {confirmedEmails.size}/{emailPreviews.length} geprüft
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
