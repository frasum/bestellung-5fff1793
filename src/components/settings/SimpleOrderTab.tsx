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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, QrCode, Trash2, Copy, ExternalLink, Smartphone, Users, Pencil, User, List, UsersRound, Package } from 'lucide-react';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useLocations } from '@/hooks/useLocations';
import { useSimpleOrderTokens, useCreateSimpleOrderToken, useUpdateSimpleOrderToken, useDeleteSimpleOrderToken } from '@/hooks/useSimpleOrderTokens';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { EmployeeTokensOverview } from './EmployeeTokensOverview';
import { EmployeesTab } from './EmployeesTab';
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
  const { data: employees = [] } = useEmployees();
  const createToken = useCreateSimpleOrderToken();
  const updateToken = useUpdateSimpleOrderToken();
  const deleteToken = useDeleteSimpleOrderToken();

  const [mainTab, setMainTab] = useState<'links' | 'employees'>('links');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedQrToken, setSelectedQrToken] = useState<string | null>(null);
  const [isMultiSupplier, setIsMultiSupplier] = useState(false);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: '',
    location_id: '',
    language: 'th',
    employee_name: '',
    employee_id: '',
  });

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
  const [isEditMultiSupplier, setIsEditMultiSupplier] = useState(false);
  const [editSelectedSupplierIds, setEditSelectedSupplierIds] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState({
    supplier_id: '',
    location_id: '',
    language: 'th',
    employee_name: '',
    employee_id: '',
  });

  const openEditDialog = (token: any) => {
    setEditingTokenId(token.id);
    setIsEditMultiSupplier(token.is_multi_supplier);
    setEditFormData({
      supplier_id: token.supplier_id || '',
      location_id: token.location_id || '',
      language: token.language,
      employee_name: token.employee_name || '',
      employee_id: token.employee_id || token.employee?.id || '',
    });
    if (token.is_multi_supplier && token.token_suppliers) {
      setEditSelectedSupplierIds(token.token_suppliers.map((ts: any) => ts.supplier_id));
    } else {
      setEditSelectedSupplierIds([]);
    }
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingTokenId) return;

    if (isEditMultiSupplier) {
      if (editSelectedSupplierIds.length === 0) {
        toast({
          title: 'Fehler',
          description: 'Bitte mindestens einen Lieferanten auswählen',
          variant: 'destructive',
        });
        return;
      }

      // Auto-generate label from supplier names
      const supplierNames = editSelectedSupplierIds
        .map(id => suppliers?.find(s => s.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      const label = supplierNames || 'Multi-Lieferanten';

      await updateToken.mutateAsync({
        id: editingTokenId,
        label,
        location_id: editFormData.location_id || null,
        language: editFormData.language,
        is_multi_supplier: true,
        supplier_id: null,
        supplier_ids: editSelectedSupplierIds,
        employee_id: editFormData.employee_id || null,
        employee_name: !editFormData.employee_id ? (editFormData.employee_name || null) : null,
      });
    } else {
      if (!editFormData.supplier_id) {
        toast({
          title: 'Fehler',
          description: 'Bitte einen Lieferanten auswählen',
          variant: 'destructive',
        });
        return;
      }

      // Auto-generate label from supplier name
      const supplier = suppliers?.find(s => s.id === editFormData.supplier_id);
      const label = supplier?.name || 'Bestellung';

      await updateToken.mutateAsync({
        id: editingTokenId,
        label,
        location_id: editFormData.location_id || null,
        language: editFormData.language,
        is_multi_supplier: false,
        supplier_id: editFormData.supplier_id,
        supplier_ids: [],
        employee_id: editFormData.employee_id || null,
        employee_name: !editFormData.employee_id ? (editFormData.employee_name || null) : null,
      });
    }

    setIsEditDialogOpen(false);
    setEditingTokenId(null);
  };

  const toggleEditSupplierSelection = (supplierId: string) => {
    setEditSelectedSupplierIds(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleCreate = async () => {
    if (isMultiSupplier) {
      if (selectedSupplierIds.length === 0) {
        toast({
          title: 'Fehler',
          description: 'Bitte mindestens einen Lieferanten auswählen',
          variant: 'destructive',
        });
        return;
      }

      // Auto-generate label from supplier names
      const supplierNames = selectedSupplierIds
        .map(id => suppliers?.find(s => s.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      const label = supplierNames || 'Multi-Lieferanten';

      await createToken.mutateAsync({
        supplier_ids: selectedSupplierIds,
        location_id: formData.location_id || null,
        label,
        language: formData.language,
        is_multi_supplier: true,
        employee_id: formData.employee_id || null,
        employee_name: !formData.employee_id ? (formData.employee_name || null) : null,
      });
    } else {
      if (!formData.supplier_id) {
        toast({
          title: 'Fehler',
          description: 'Bitte einen Lieferanten auswählen',
          variant: 'destructive',
        });
        return;
      }

      // Auto-generate label from supplier name
      const supplier = suppliers?.find(s => s.id === formData.supplier_id);
      const label = supplier?.name || 'Bestellung';

      await createToken.mutateAsync({
        supplier_id: formData.supplier_id,
        location_id: formData.location_id || null,
        label,
        language: formData.language,
        employee_id: formData.employee_id || null,
        employee_name: !formData.employee_id ? (formData.employee_name || null) : null,
      });
    }

    setIsDialogOpen(false);
    setFormData({ supplier_id: '', location_id: '', language: 'th', employee_name: '', employee_id: '' });
    setSelectedSupplierIds([]);
    setIsMultiSupplier(false);
  };

  const getOrderUrl = (token: string) => {
    return `https://bestellung.pro/simple-order/${token}`;
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
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as 'links' | 'employees')} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="links" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                {t('settings.simpleOrder.tabs.links', 'Bestelllinks')}
              </TabsTrigger>
              <TabsTrigger value="employees" className="flex items-center gap-2">
                <UsersRound className="h-4 w-4" />
                {t('settings.simpleOrder.tabs.employees', 'Mitarbeiter')}
              </TabsTrigger>
            </TabsList>
            
            {mainTab === 'links' && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setIsMultiSupplier(false);
                  setSelectedSupplierIds([]);
                  setFormData({ supplier_id: '', location_id: '', language: 'th', employee_name: '', employee_id: '' });
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
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
                      <Label>{t('settings.simpleOrder.employee', 'Mitarbeiter')} ({t('common.optional', 'optional')})</Label>
                      <Select
                        value={formData.employee_id || 'none'}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          employee_id: value === 'none' ? '' : value,
                          employee_name: value === 'none' ? prev.employee_name : ''
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Mitarbeiter auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kein Mitarbeiter zugewiesen</SelectItem>
                          {employees.filter(e => e.is_active).map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.simpleOrder.employeeHint', 'Der Name wird automatisch ausgefüllt und ist nicht änderbar')}
                      </p>
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
            )}
          </div>

          <TabsContent value="links" className="space-y-4 mt-0">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grouped')}
              >
                <Package className="h-4 w-4 mr-2" />
                {t('settings.simpleOrder.groupedView', 'Gruppiert')}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                {t('settings.simpleOrder.listView', 'Liste')}
              </Button>
            </div>

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
            ) : viewMode === 'grouped' ? (
              <EmployeeTokensOverview
                tokens={tokens}
                onEdit={openEditDialog}
                onToggleActive={(id, isActive) => updateToken.mutate({ id, is_active: isActive })}
                onDelete={(id) => deleteToken.mutate(id)}
              />
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => (
                  <Card key={token.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{token.label}</h4>
                          {token.is_multi_supplier && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Multi
                            </Badge>
                          )}
                          {!token.is_active && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inaktiv
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getSupplierNames(token)}
                        </p>
                        {token.location && (
                          <p className="text-xs text-muted-foreground mt-1">
                            📍 {token.location.name}
                          </p>
                        )}
                        {(token.employee?.name || token.employee_name) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            👤 {token.employee?.name || token.employee_name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{LANGUAGES.find(l => l.code === token.language)?.name}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(token.token)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(getOrderUrl(token.token), '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Dialog open={selectedQrToken === token.token} onOpenChange={(open) => setSelectedQrToken(open ? token.token : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-sm">
                              <DialogHeader>
                                <DialogTitle>QR-Code</DialogTitle>
                                <DialogDescription>
                                  Scannen Sie diesen QR-Code um zu bestellen
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-center p-4">
                                <img
                                  src={generateQrCodeUrl(token.token)}
                                  alt="QR Code"
                                  className="rounded-lg"
                                />
                              </div>
                              <div className="text-center text-sm text-muted-foreground break-all">
                                {getOrderUrl(token.token)}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(token)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={token.is_active}
                            onCheckedChange={(checked) => updateToken.mutate({ id: token.id, is_active: checked })}
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Link löschen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Dieser Bestelllink wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteToken.mutate(token.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="employees" className="mt-0">
            <EmployeesTab />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingTokenId(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Bestelllink bearbeiten</DialogTitle>
              <DialogDescription>
                Passen Sie die Einstellungen für diesen Bestelllink an
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
                  checked={isEditMultiSupplier}
                  onCheckedChange={(checked) => {
                    setIsEditMultiSupplier(checked);
                    if (!checked) {
                      setEditSelectedSupplierIds([]);
                    } else {
                      setEditFormData(prev => ({ ...prev, supplier_id: '' }));
                    }
                  }}
                />
              </div>

              {/* Supplier Selection */}
              {isEditMultiSupplier ? (
                <div className="space-y-2">
                  <Label>Lieferanten auswählen *</Label>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {suppliers?.map((supplier) => (
                      <label
                        key={supplier.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={editSelectedSupplierIds.includes(supplier.id)}
                          onCheckedChange={() => toggleEditSupplierSelection(supplier.id)}
                        />
                        <span className="flex-1">{supplier.name}</span>
                      </label>
                    ))}
                  </div>
                  {editSelectedSupplierIds.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {editSelectedSupplierIds.length} Lieferanten ausgewählt
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>{t('settings.simpleOrder.supplier', 'Lieferant')} *</Label>
                  <Select
                    value={editFormData.supplier_id}
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, supplier_id: value }))}
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
                <Label>{t('settings.simpleOrder.employeeName', 'Mitarbeitername')} ({t('common.optional', 'optional')})</Label>
                <Input
                  value={editFormData.employee_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, employee_name: e.target.value }))}
                  placeholder={t('settings.simpleOrder.employeeNamePlaceholder', 'z.B. Somchai, Maria')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.simpleOrder.employeeNameHint', 'Wenn gesetzt, wird der Name automatisch ausgefüllt und ist nicht änderbar')}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t('settings.simpleOrder.location', 'Standort')} ({t('common.optional', 'optional')})</Label>
                <Select
                  value={editFormData.location_id || 'all'}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, location_id: value === 'all' ? '' : value }))}
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
                <Label>{t('settings.simpleOrder.language', 'Sprache')}</Label>
                <Select
                  value={editFormData.language}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, language: value }))}
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
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleUpdate} disabled={updateToken.isPending}>
                {updateToken.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
