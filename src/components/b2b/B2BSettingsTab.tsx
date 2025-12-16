import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Palette, Building2, ExternalLink, Copy, Check, Link2, Upload, Trash2, Loader2, ImageIcon, Truck, Plus, Pencil } from 'lucide-react';
import B2BSupplierFormDialog from './B2BSupplierFormDialog';

interface B2BAccount {
  id: string;
  company_name: string;
  subdomain: string;
  email: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_message: string | null;
  subscription_tier: string;
  is_active: boolean;
  linked_supplier_id: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface B2BSupplier {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  description: string | null;
  is_active: boolean | null;
  article_count?: number;
  account_id: string;
  logo_url: string | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface B2BSettingsTabProps {
  account: B2BAccount;
  onUpdate: () => void;
}

const B2BSettingsTab = ({ account, onUpdate }: B2BSettingsTabProps) => {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(account.company_name);
  const [primaryColor, setPrimaryColor] = useState(account.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(account.secondary_color);
  const [welcomeMessage, setWelcomeMessage] = useState(account.welcome_message || '');
  const [linkedSupplierId, setLinkedSupplierId] = useState(account.linked_supplier_id || 'none');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [copied, setCopied] = useState(false);
  const [logoUrl, setLogoUrl] = useState(account.logo_url);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // B2B Suppliers Management
  const [b2bSuppliers, setB2bSuppliers] = useState<B2BSupplier[]>([]);
  const [loadingB2bSuppliers, setLoadingB2bSuppliers] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<B2BSupplier | null>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<B2BSupplier | null>(null);

  const portalUrl = `${window.location.origin}/b2b/portal/${account.subdomain}`;

  useEffect(() => {
    loadSuppliers();
    loadB2bSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      let allSuppliers: Supplier[] = [];

      // 1. Load linked supplier directly if exists (may be from different org)
      if (account.linked_supplier_id) {
        const { data: linkedSupplier } = await supabase
          .from('suppliers')
          .select('id, name')
          .eq('id', account.linked_supplier_id)
          .maybeSingle();
        
        if (linkedSupplier) {
          allSuppliers.push(linkedSupplier);
        }
      }

      // 2. Load suppliers from user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.organization_id) {
          const { data: orgSuppliers } = await supabase
            .from('suppliers')
            .select('id, name')
            .eq('organization_id', profile.organization_id)
            .order('name');

          // Add org suppliers, avoiding duplicates
          if (orgSuppliers) {
            const existingIds = new Set(allSuppliers.map(s => s.id));
            for (const s of orgSuppliers) {
              if (!existingIds.has(s.id)) {
                allSuppliers.push(s);
              }
            }
          }
        }
      }

      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadB2bSuppliers = async () => {
    setLoadingB2bSuppliers(true);
    try {
      const { data, error } = await supabase
        .from('b2b_suppliers')
        .select('*')
        .eq('account_id', account.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Get article counts
      const suppliersWithCounts = await Promise.all(
        (data || []).map(async (supplier) => {
          const { count } = await supabase
            .from('supplier_b2b_articles')
            .select('id', { count: 'exact', head: true })
            .eq('supplier_id', supplier.id);
          return { ...supplier, article_count: count || 0 };
        })
      );

      setB2bSuppliers(suppliersWithCounts);
    } catch (error) {
      console.error('Error loading B2B suppliers:', error);
    } finally {
      setLoadingB2bSuppliers(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteSupplier) return;

    // Check for articles
    if (deleteSupplier.article_count && deleteSupplier.article_count > 0) {
      toast.error(`Lieferant hat ${deleteSupplier.article_count} Artikel. Bitte löschen Sie zuerst alle Artikel.`);
      setDeleteSupplier(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('b2b_suppliers')
        .delete()
        .eq('id', deleteSupplier.id);

      if (error) throw error;

      toast.success('Lieferant gelöscht');
      loadB2bSuppliers();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting supplier:', error);
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteSupplier(null);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('supplier_b2b_accounts')
        .update({
          company_name: companyName,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          welcome_message: welcomeMessage || null,
          linked_supplier_id: linkedSupplierId === 'none' ? null : linkedSupplierId,
        })
        .eq('id', account.id);

      if (error) throw error;

      toast.success('Einstellungen gespeichert');
      onUpdate();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const copyPortalUrl = async () => {
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toast.success('URL kopiert');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wählen Sie eine Bilddatei');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Datei zu groß (max. 2MB)');
      return;
    }

    setUploadingLogo(true);
    try {
      // Delete old logo if exists
      if (logoUrl) {
        const oldPath = logoUrl.split('/b2b-portal-logos/')[1]?.split('?')[0];
        if (oldPath) {
          await supabase.storage.from('b2b-portal-logos').remove([oldPath]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `${account.id}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('b2b-portal-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('b2b-portal-logos')
        .getPublicUrl(fileName);

      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      // Save URL to database
      const { error: updateError } = await supabase
        .from('supplier_b2b_accounts')
        .update({ logo_url: urlWithCacheBust })
        .eq('id', account.id);

      if (updateError) throw updateError;

      setLogoUrl(urlWithCacheBust);
      toast.success('Logo hochgeladen');
      onUpdate();
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Fehler beim Hochladen: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoUrl) return;

    try {
      const path = logoUrl.split('/b2b-portal-logos/')[1]?.split('?')[0];
      if (path) {
        await supabase.storage.from('b2b-portal-logos').remove([path]);
      }

      await supabase
        .from('supplier_b2b_accounts')
        .update({ logo_url: null })
        .eq('id', account.id);

      setLogoUrl(null);
      toast.success('Logo entfernt');
      onUpdate();
    } catch (error: any) {
      console.error('Error removing logo:', error);
      toast.error('Fehler beim Entfernen: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <Accordion type="multiple" className="w-full">
          {/* B2B Suppliers Management */}
          <AccordionItem value="b2b-suppliers" className="border-b">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                <span className="font-medium group-data-[state=open]:text-primary transition-colors">
                  Lieferanten verwalten
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({b2bSuppliers.length})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-4">
                Verwalten Sie Ihre Lieferanten für das B2B-Portal
              </p>
              
              <div className="space-y-3">
                {loadingB2bSuppliers ? (
                  <div className="text-sm text-muted-foreground">Laden...</div>
                ) : b2bSuppliers.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Noch keine Lieferanten angelegt.
                  </div>
                ) : (
                  b2bSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                    >
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {supplier.name}
                          {!supplier.is_active && (
                            <span className="text-xs text-muted-foreground">(inaktiv)</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.article_count} Artikel
                          {supplier.contact_email && ` • ${supplier.contact_email}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingSupplier(supplier);
                            setSupplierDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteSupplier(supplier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupplierDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neuen Lieferanten anlegen
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Supplier Linking */}
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
                    {suppliers
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

          {/* Portal URL */}
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
                <Button variant="outline" onClick={copyPortalUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="outline" onClick={() => window.open(portalUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Ihre Subdomain: <code className="bg-muted px-1 rounded">{account.subdomain}</code>
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Company Info */}
          <AccordionItem value="company" className="border-b">
            <AccordionTrigger className="group px-4 py-3 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-primary/5">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground group-data-[state=open]:text-primary transition-colors" />
                <span className="font-medium group-data-[state=open]:text-primary transition-colors">
                  Unternehmensdaten
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 bg-primary/5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Firmenname</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
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

          {/* Branding */}
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
                          onChange={handleLogoUpload}
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
                            onClick={handleRemoveLogo}
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
        </Accordion>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Speichern...' : 'Einstellungen speichern'}
        </Button>
      </div>

      {/* Supplier Form Dialog */}
      <B2BSupplierFormDialog
        open={supplierDialogOpen}
        onOpenChange={setSupplierDialogOpen}
        supplier={editingSupplier}
        accountId={account.id}
        onSuccess={() => {
          loadB2bSuppliers();
          onUpdate();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteSupplier} onOpenChange={() => setDeleteSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lieferant löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Lieferanten "{deleteSupplier?.name}" wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSupplier}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default B2BSettingsTab;
