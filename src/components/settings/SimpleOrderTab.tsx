import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, QrCode, Trash2, Copy, ExternalLink, Smartphone, Users } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useLocations } from '@/hooks/useLocations';
import { useSimpleOrderTokens, useCreateSimpleOrderToken, useUpdateSimpleOrderToken, useDeleteSimpleOrderToken } from '@/hooks/useSimpleOrderTokens';
import { useToast } from '@/hooks/use-toast';

const LANGUAGES = [
  { code: 'th', name: 'ไทย (Thai)' },
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Tiếng Việt' },
];

export function SimpleOrderTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: locations } = useLocations();
  const { data: tokens, isLoading: tokensLoading } = useSimpleOrderTokens();
  const createToken = useCreateSimpleOrderToken();
  const updateToken = useUpdateSimpleOrderToken();
  const deleteToken = useDeleteSimpleOrderToken();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQrToken, setSelectedQrToken] = useState<string | null>(null);
  const [isMultiSupplier, setIsMultiSupplier] = useState(false);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    location_id: '',
    label: '',
    language: 'th',
  });

  const handleCreate = async () => {
    if (isMultiSupplier) {
      if (selectedSupplierIds.length === 0 || !formData.label) {
        toast({
          title: 'Fehler',
          description: 'Bitte mindestens einen Lieferanten und eine Bezeichnung angeben',
          variant: 'destructive',
        });
        return;
      }

      await createToken.mutateAsync({
        supplier_ids: selectedSupplierIds,
        location_id: formData.location_id || null,
        label: formData.label,
        language: formData.language,
        is_multi_supplier: true,
      });
    } else {
      if (!formData.supplier_id || !formData.label) {
        toast({
          title: 'Fehler',
          description: 'Bitte Lieferant und Bezeichnung angeben',
          variant: 'destructive',
        });
        return;
      }

      await createToken.mutateAsync({
        supplier_id: formData.supplier_id,
        location_id: formData.location_id || null,
        label: formData.label,
        language: formData.language,
      });
    }

    setIsDialogOpen(false);
    setFormData({ supplier_id: '', location_id: '', label: '', language: 'th' });
    setSelectedSupplierIds([]);
    setIsMultiSupplier(false);
  };

  const getOrderUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/simple-order/${token}`;
  };

  const copyToClipboard = (token: string) => {
    navigator.clipboard.writeText(getOrderUrl(token));
    toast({
      title: 'Link kopiert',
      description: 'Der Link wurde in die Zwischenablage kopiert.',
    });
  };

  const generateQrCodeUrl = (token: string) => {
    const url = encodeURIComponent(getOrderUrl(token));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  };

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSupplierIds(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const getSupplierNames = (token: any) => {
    if (token.is_multi_supplier && token.token_suppliers) {
      return token.token_suppliers.map((ts: any) => ts.supplier?.name).filter(Boolean).join(', ');
    }
    return token.supplier?.name || '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {t('settings.simpleOrder.title', 'Einfache Bestellung')}
            </CardTitle>
            <CardDescription>
              {t('settings.simpleOrder.description', 'QR-Codes für Mitarbeiter zum einfachen Bestellen erstellen')}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setIsMultiSupplier(false);
              setSelectedSupplierIds([]);
              setFormData({ supplier_id: '', location_id: '', label: '', language: 'th' });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('settings.simpleOrder.createLink', 'Neuen Link erstellen')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t('settings.simpleOrder.createTitle', 'Bestelllink erstellen')}</DialogTitle>
                <DialogDescription>
                  {t('settings.simpleOrder.createDescription', 'Erstellen Sie einen QR-Code für einfache Bestellungen')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Multi-Supplier Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Multi-Lieferanten
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Ein QR-Code für mehrere Lieferanten
                    </p>
                  </div>
                  <Switch
                    checked={isMultiSupplier}
                    onCheckedChange={(checked) => {
                      setIsMultiSupplier(checked);
                      if (!checked) {
                        setSelectedSupplierIds([]);
                      } else {
                        setFormData(prev => ({ ...prev, supplier_id: '' }));
                      }
                    }}
                  />
                </div>

                {/* Supplier Selection */}
                {isMultiSupplier ? (
                  <div className="space-y-2">
                    <Label>Lieferanten auswählen *</Label>
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {suppliers?.map((supplier) => (
                        <label
                          key={supplier.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                        >
                          <Checkbox
                            checked={selectedSupplierIds.includes(supplier.id)}
                            onCheckedChange={() => toggleSupplierSelection(supplier.id)}
                          />
                          <span className="flex-1">{supplier.name}</span>
                        </label>
                      ))}
                    </div>
                    {selectedSupplierIds.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selectedSupplierIds.length} Lieferanten ausgewählt
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>{t('settings.simpleOrder.supplier', 'Lieferant')} *</Label>
                    <Select
                      value={formData.supplier_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('settings.simpleOrder.selectSupplier', 'Lieferant auswählen')} />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t('settings.simpleOrder.location', 'Standort')} ({t('common.optional', 'optional')})</Label>
                  <Select
                    value={formData.location_id || 'all'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value === 'all' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('settings.simpleOrder.allLocations', 'Alle Standorte')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {t('settings.simpleOrder.allLocations', 'Alle Standorte')}
                      </SelectItem>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.simpleOrder.label', 'Bezeichnung')} *</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder={t('settings.simpleOrder.labelPlaceholder', 'z.B. Küche YUM, Lager')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('settings.simpleOrder.language', 'Sprache')}</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreate} disabled={createToken.isPending}>
                  {createToken.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tokensLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : !tokens?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('settings.simpleOrder.noTokens', 'Noch keine Bestelllinks erstellt')}</p>
            <p className="text-sm mt-1">
              {t('settings.simpleOrder.noTokensDescription', 'Erstellen Sie einen Link, damit Mitarbeiter einfach bestellen können')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <Card key={token.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{token.label}</h3>
                      {token.is_multi_supplier ? (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {token.token_suppliers?.length || 0} Lieferanten
                        </Badge>
                      ) : (
                        <Badge variant="outline">{token.supplier?.name}</Badge>
                      )}
                      {token.location && (
                        <Badge variant="secondary">{token.location.name}</Badge>
                      )}
                      <Badge variant={token.is_active ? 'default' : 'destructive'}>
                        {token.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                    {token.is_multi_supplier && token.token_suppliers && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {getSupplierNames(token)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {LANGUAGES.find(l => l.code === token.language)?.name || token.language}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={token.is_active}
                      onCheckedChange={(checked) => 
                        updateToken.mutate({ id: token.id, is_active: checked })
                      }
                    />
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(token.token)}
                      title="Link kopieren"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Dialog open={selectedQrToken === token.token} onOpenChange={(open) => setSelectedQrToken(open ? token.token : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" title="QR-Code anzeigen">
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>QR-Code: {token.label}</DialogTitle>
                          <DialogDescription>
                            {token.is_multi_supplier 
                              ? `Scannen Sie diesen QR-Code zum Bestellen bei ${token.token_suppliers?.length || 0} Lieferanten`
                              : `Scannen Sie diesen QR-Code zum Bestellen bei ${token.supplier?.name}`
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center p-4">
                          <img
                            src={generateQrCodeUrl(token.token)}
                            alt={`QR Code for ${token.label}`}
                            className="w-64 h-64"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="flex-1"
                            variant="outline"
                            onClick={() => window.open(getOrderUrl(token.token), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Link öffnen
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                const supplierInfo = token.is_multi_supplier 
                                  ? `${token.token_suppliers?.length || 0} Lieferanten`
                                  : token.supplier?.name || '';
                                printWindow.document.write(`
                                  <html>
                                    <head><title>QR-Code: ${token.label}</title></head>
                                    <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:sans-serif;">
                                      <h1 style="margin-bottom:20px;">${token.label}</h1>
                                      <img src="${generateQrCodeUrl(token.token)}" style="width:300px;height:300px;" />
                                      <p style="margin-top:20px;color:#666;">${supplierInfo}</p>
                                    </body>
                                  </html>
                                `);
                                printWindow.document.close();
                                printWindow.print();
                              }
                            }}
                          >
                            Drucken
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Bestelllink löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Der Link "{token.label}" wird dauerhaft gelöscht und kann nicht mehr verwendet werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteToken.mutate(token.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
