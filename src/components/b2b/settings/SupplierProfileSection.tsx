import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Truck, Mail, Globe } from 'lucide-react';

interface B2BSupplier {
  id: string;
  name: string;
  article_count?: number;
}

interface SupplierProfileSectionProps {
  selectedSupplierId: string | undefined;
  supplierName: string;
  setSupplierName: (name: string) => void;
  supplierEmail: string;
  setSupplierEmail: (email: string) => void;
  supplierPhone: string;
  setSupplierPhone: (phone: string) => void;
  supplierDescription: string;
  setSupplierDescription: (desc: string) => void;
  supplierOrderDeliveryMethod: string;
  setSupplierOrderDeliveryMethod: (method: string) => void;
  savingSupplier: boolean;
  onSaveSupplier: () => void;
  onDeleteSupplier: (supplier: B2BSupplier) => void;
  b2bSuppliers: B2BSupplier[];
}

export function SupplierProfileSection({
  selectedSupplierId,
  supplierName,
  setSupplierName,
  supplierEmail,
  setSupplierEmail,
  supplierPhone,
  setSupplierPhone,
  supplierDescription,
  setSupplierDescription,
  supplierOrderDeliveryMethod,
  setSupplierOrderDeliveryMethod,
  savingSupplier,
  onSaveSupplier,
  onDeleteSupplier,
  b2bSuppliers,
}: SupplierProfileSectionProps) {
  if (!selectedSupplierId) return null;

  const supplier = b2bSuppliers.find(s => s.id === selectedSupplierId);
  const canDelete = supplier && (!supplier.article_count || supplier.article_count === 0);

  return (
    <AccordionItem value="supplier-profile" className="border-b">
      <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
          <span className="font-medium group-data-[state=open]:text-primary transition-colors">
            Lieferanten-Profil: {supplierName}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 bg-primary/5">
        <p className="text-sm text-muted-foreground mb-4">
          Bearbeiten Sie die Daten des ausgewählten Lieferanten
        </p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplierName">Name</Label>
            <Input
              id="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierEmail">E-Mail</Label>
              <Input
                id="supplierEmail"
                type="email"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
                placeholder="kontakt@lieferant.de"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierPhone">Telefon</Label>
              <Input
                id="supplierPhone"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="+49 123 456789"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierOrderDelivery">Bestellungs-Zustellung</Label>
            <Select value={supplierOrderDeliveryMethod} onValueChange={setSupplierOrderDeliveryMethod}>
              <SelectTrigger id="supplierOrderDelivery">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Per E-Mail
                  </div>
                </SelectItem>
                <SelectItem value="portal">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Ins Lieferantenportal
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-Mail + Portal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Legen Sie fest, wie Sie Bestellungen von Ihren Kunden erhalten möchten
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierDescription">Beschreibung</Label>
            <Textarea
              id="supplierDescription"
              value={supplierDescription}
              onChange={(e) => setSupplierDescription(e.target.value)}
              placeholder="Beschreibung des Lieferanten..."
              rows={3}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button onClick={onSaveSupplier} disabled={savingSupplier}>
              {savingSupplier ? 'Speichern...' : 'Lieferanten-Daten speichern'}
            </Button>
            {supplier && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onDeleteSupplier(supplier)}
                disabled={!canDelete}
                title={canDelete ? 'Lieferant löschen' : 'Lieferant hat noch Artikel'}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Löschen
              </Button>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
