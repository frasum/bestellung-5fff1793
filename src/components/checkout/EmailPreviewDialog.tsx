import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Send, Loader2, ChevronLeft, ChevronRight, Pencil, Check, ExternalLink, CheckCircle2, Plus, Minus, Trash2, PlusCircle, Search, Package } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { useEmailTemplate, getDefaultTemplate } from '@/hooks/useEmailTemplates';


interface OrderItem {
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  sku?: string;
  packaging_unit?: number;
  order_unit?: string;
}

export interface EmailPreviewData {
  supplierName: string;
  supplierEmail: string;
  restaurantName: string;
  locationEmail?: string;
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
  const [showAddArticleSheet, setShowAddArticleSheet] = useState(false);
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const { data: emailTemplate } = useEmailTemplate();
  const defaultTemplate = getDefaultTemplate();
  const currentEmail = emailPreviews[currentIndex];

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmedEmails(new Set());
      setCurrentIndex(0);
      setIsEditingNotes(false);
      setIsEditingAddress(false);
      setShowAddArticleSheet(false);
      setArticleSearchQuery('');
    }
  }, [open]);

  // Check if all emails are confirmed
  const allEmailsConfirmed = confirmedEmails.size === emailPreviews.length;

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

  // Get template values (use saved or defaults)
  const template = {
    subject_template: emailTemplate?.subject_template || defaultTemplate.subject_template || '',
    greeting: emailTemplate?.greeting || defaultTemplate.greeting || '',
    introduction: emailTemplate?.introduction || defaultTemplate.introduction || '',
    closing: emailTemplate?.closing || defaultTemplate.closing || '',
    signature: emailTemplate?.signature || defaultTemplate.signature || '',
    article_list_format: '- {article_name}{sku_suffix}: {quantity} {unit}',
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

  // Get all available articles from all email previews for adding
  const allAvailableArticles = useMemo(() => {
    const articlesMap = new Map<string, OrderItem>();
    emailPreviews.forEach(preview => {
      preview.items.forEach(item => {
        if (!articlesMap.has(item.article_name)) {
          articlesMap.set(item.article_name, item);
        }
      });
    });
    return Array.from(articlesMap.values());
  }, [emailPreviews]);

  // Filter articles not already in current email
  const availableArticlesToAdd = useMemo(() => {
    if (!currentEmail) return allAvailableArticles;
    const currentArticleNames = new Set(currentEmail.items.map(i => i.article_name));
    return allAvailableArticles.filter(a => !currentArticleNames.has(a.article_name));
  }, [allAvailableArticles, currentEmail]);

  // Filtered by search
  const filteredArticlesToAdd = useMemo(() => {
    if (!articleSearchQuery.trim()) return availableArticlesToAdd;
    const query = articleSearchQuery.toLowerCase();
    return availableArticlesToAdd.filter(a =>
      a.article_name.toLowerCase().includes(query) ||
      (a.sku && a.sku.toLowerCase().includes(query))
    );
  }, [availableArticlesToAdd, articleSearchQuery]);

  // Early return AFTER all hooks
  if (!currentEmail) return null;

  // Update item quantity
  const updateItemQuantity = (itemIndex: number, newQuantity: number) => {
    const newItems = [...currentEmail.items];
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      newItems.splice(itemIndex, 1);
    } else {
      newItems[itemIndex] = { 
        ...newItems[itemIndex], 
        quantity: newQuantity,
        total_price: newItems[itemIndex].unit_price * newQuantity
      };
    }
    // Recalculate total
    const newTotal = newItems.reduce((sum, item) => sum + item.total_price, 0);
    updateCurrentEmail({ items: newItems, totalAmount: newTotal });
  };

  // Remove item
  const removeItem = (itemIndex: number) => {
    const newItems = currentEmail.items.filter((_, i) => i !== itemIndex);
    const newTotal = newItems.reduce((sum, item) => sum + item.total_price, 0);
    updateCurrentEmail({ items: newItems, totalAmount: newTotal });
  };

  // Add article to current email
  const addArticleToEmail = (article: OrderItem) => {
    const newItem = { ...article, quantity: 1, total_price: article.unit_price };
    const newItems = [...currentEmail.items, newItem];
    const newTotal = newItems.reduce((sum, item) => sum + item.total_price, 0);
    updateCurrentEmail({ items: newItems, totalAmount: newTotal });
    setShowAddArticleSheet(false);
    setArticleSearchQuery('');
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
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Mail className="w-5 h-5 text-primary" />
            <span className="hidden sm:inline">E-Mail Vorschau</span>
            <span className="sm:hidden">Vorschau</span>
            {emailPreviews.length > 1 && (
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                ({currentIndex + 1}/{emailPreviews.length} | {confirmedEmails.size} geprüft)
              </span>
            )}
            {confirmedEmails.has(currentIndex) && (
              <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Bestätigt
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-4">
            {/* Email Header */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">An:</span>
                <span className="font-medium">{currentEmail.supplierEmail}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">Von:</span>
                <span>{currentEmail.restaurantName} &lt;yum@bestellung.pro&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-12">Betreff:</span>
                <span className="font-medium">
                  {generateEmailSubject(currentEmail)}
                </span>
              </div>
            </div>


            {/* Email Body Preview */}
            <div className={`border-2 rounded-lg overflow-hidden transition-all ${
              confirmedEmails.has(currentIndex)
                ? 'border-green-500 bg-green-50/30 dark:bg-green-950/20'
                : 'border-border'
            }`}>
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

                {/* Items - Mobile Card View */}
                <div className="sm:hidden space-y-2">
                  {currentEmail.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.article_name}</p>
                          {item.sku && <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                          onClick={() => removeItem(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center"
                          min={1}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <span className="text-xs text-muted-foreground">{item.unit}</span>
                        {item.packaging_unit && item.packaging_unit > 1 && (
                          <span className="text-xs text-primary">({item.packaging_unit}er)</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Article Button - Mobile */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAddArticleSheet(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Artikel hinzufügen
                  </Button>
                </div>

                {/* Items - Desktop Table */}
                <div className="hidden sm:block">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-semibold">Artikel</th>
                          <th className="text-center p-3 font-semibold">Menge</th>
                          <th className="text-center p-3 font-semibold w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {currentEmail.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="p-3">
                              <div>{item.article_name}</div>
                              {item.sku && <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(idx, parseInt(e.target.value) || 0)}
                                  className="w-16 h-8 text-center"
                                  min={1}
                                />
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <span className="text-muted-foreground ml-1">{item.unit}</span>
                                {item.packaging_unit && item.packaging_unit > 1 && (
                                  <span className="ml-1 text-primary font-medium">({item.packaging_unit}er)</span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => removeItem(idx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Add Article Button - Desktop */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setShowAddArticleSheet(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Artikel hinzufügen
                  </Button>
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

            {/* Confirmation Checkbox - at the bottom after email content */}
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
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-6"
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
          </div>
        </div>

        {/* Footer - fixed at bottom with proper styling */}
        <DialogFooter className="flex flex-col gap-3 pt-4 border-t bg-background shrink-0">
          {/* Navigation - nur bei mehreren E-Mails */}
          {emailPreviews.length > 1 && (
            <div className="flex justify-between items-center w-full">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Vorherige
              </Button>
              <span className="text-sm text-muted-foreground font-medium">
                {currentIndex + 1} von {emailPreviews.length}
              </span>
              <Button variant="outline" size="sm" onClick={goNext} disabled={currentIndex === emailPreviews.length - 1}>
                Nächste
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
          
          {/* Aktions-Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={isSubmitting} 
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={onConfirm} 
              disabled={isSubmitting || !allEmailsConfirmed}
              title={!allEmailsConfirmed ? `Bitte alle ${emailPreviews.length} E-Mails prüfen` : undefined}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sende Bestellungen...
                </>
              ) : !allEmailsConfirmed ? (
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
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Add Article Sheet */}
      <Sheet open={showAddArticleSheet} onOpenChange={setShowAddArticleSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Artikel hinzufügen
            </SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={articleSearchQuery}
                onChange={(e) => setArticleSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Available Articles */}
            <ScrollArea className="h-[calc(100vh-200px)]">
              {filteredArticlesToAdd.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {availableArticlesToAdd.length === 0 
                    ? 'Alle Artikel sind bereits in der Bestellung'
                    : 'Keine Artikel gefunden'
                  }
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredArticlesToAdd.map((article, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => addArticleToEmail(article)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{article.article_name}</p>
                          {article.sku && (
                            <p className="text-xs text-muted-foreground">SKU: {article.sku}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {article.unit_price.toFixed(2)} € / {article.unit}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    </Dialog>
  );
};
