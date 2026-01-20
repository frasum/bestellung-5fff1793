import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Link2, Upload, Trash2, Loader2, ImageIcon, Building2, Palette } from 'lucide-react';
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

interface Supplier {
  id: string;
  name: string;
}

interface PortalSettingsSectionProps {
  portalUrl: string;
  subdomain: string;
  copied: boolean;
  onCopyUrl: () => void;
  welcomeMessage: string;
  setWelcomeMessage: (message: string) => void;
  linkedSupplierId: string;
  setLinkedSupplierId: (id: string) => void;
  bestellungSuppliers: Supplier[];
  isSupplierUser: boolean;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  logoUrl: string | null;
  uploadingLogo: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

export function PortalUrlSection({
  portalUrl,
  subdomain,
  copied,
  onCopyUrl,
}: Pick<PortalSettingsSectionProps, 'portalUrl' | 'subdomain' | 'copied' | 'onCopyUrl'>) {
  return (
    <AccordionItem value="portal" className="border-b">
      <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
          <span className="font-medium group-data-[state=open]:text-primary transition-colors">
            Portal-URL
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 bg-primary/5">
        <p className="text-sm text-muted-foreground mb-4">
          Teilen Sie diese URL mit Ihren Kunden
        </p>
        <div className="flex gap-2">
          <Input value={portalUrl} readOnly className="font-mono text-sm" />
          <Button variant="outline" onClick={onCopyUrl}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => window.open(portalUrl, '_blank')}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Ihre Subdomain: <code className="bg-muted px-1 rounded">{subdomain}</code>
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

export function SupplierLinkingSection({
  linkedSupplierId,
  setLinkedSupplierId,
  bestellungSuppliers,
  isSupplierUser,
}: Pick<PortalSettingsSectionProps, 'linkedSupplierId' | 'setLinkedSupplierId' | 'bestellungSuppliers' | 'isSupplierUser'>) {
  if (isSupplierUser) return null;

  return (
    <AccordionItem value="linking" className="border-b">
      <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
          <span className="font-medium group-data-[state=open]:text-primary transition-colors">
            Bestellung.pro Verknüpfung
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 bg-primary/5">
        <p className="text-sm text-muted-foreground mb-4">
          Verknüpfen Sie Ihren Bestellung.pro Lieferanten, um Artikel zu importieren
        </p>
        <div className="space-y-2">
          <Label htmlFor="linkedSupplier">Verknüpfter Lieferant</Label>
          <Select value={linkedSupplierId} onValueChange={setLinkedSupplierId}>
            <SelectTrigger>
              <SelectValue placeholder="Lieferant auswählen..." />
            </SelectTrigger>
            <SelectContent className="bg-card border border-border z-50">
              <SelectItem value="none">Keine Verknüpfung</SelectItem>
              {bestellungSuppliers
                .filter((supplier) => supplier.id && supplier.id.trim() !== '')
                .map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {linkedSupplierId && linkedSupplierId !== 'none'
              ? 'Sie können jetzt Artikel aus Ihrem Bestellung.pro Katalog importieren.'
              : 'Wählen Sie einen Lieferanten, um Artikel zu importieren.'}
          </p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function PortalSettingsSection({
  welcomeMessage,
  setWelcomeMessage,
}: Pick<PortalSettingsSectionProps, 'welcomeMessage' | 'setWelcomeMessage'>) {
  return (
    <AccordionItem value="company" className="border-b">
      <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
          <span className="font-medium group-data-[state=open]:text-primary transition-colors">
            Portal-Einstellungen
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 bg-primary/5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Willkommensnachricht</Label>
            <Textarea
              id="welcomeMessage"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Wird auf der Startseite Ihres Portals angezeigt"
              rows={3}
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function BrandingSection({
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  logoUrl,
  uploadingLogo,
  onLogoUpload,
  onRemoveLogo,
}: Pick<PortalSettingsSectionProps, 'primaryColor' | 'setPrimaryColor' | 'secondaryColor' | 'setSecondaryColor' | 'logoUrl' | 'uploadingLogo' | 'onLogoUpload' | 'onRemoveLogo'>) {
  return (
    <AccordionItem value="branding" className="border-b-0">
      <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
          <span className="font-medium group-data-[state=open]:text-primary transition-colors">
            Branding
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 bg-primary/5">
        <p className="text-sm text-muted-foreground mb-4">
          Passen Sie das Erscheinungsbild Ihres Portals an
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#1e40af"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-3">Vorschau</p>
            <div className="flex gap-2">
              <Button style={{ backgroundColor: primaryColor }}>
                Primär-Button
              </Button>
              <Button variant="outline" style={{ borderColor: primaryColor, color: primaryColor }}>
                Outline-Button
              </Button>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              
              {/* Upload/Remove Buttons */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="b2b-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={onLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={() => document.getElementById('b2b-logo-upload')?.click()}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {logoUrl ? 'Ändern' : 'Hochladen'}
                  </Button>
                  {logoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRemoveLogo}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Entfernen
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Max. 2MB, empfohlen: 200x200px
                </p>
              </div>
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
