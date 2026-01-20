import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Shield, Wine, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Employee } from '@/hooks/useEmployees';
import type { EmployeeFormData, LocationAssignment } from './types';
import { LANGUAGES } from './types';

interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

interface Supplier {
  id: string;
  name: string;
  is_active: boolean;
}

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingEmployee: Employee | null;
  formData: EmployeeFormData;
  setFormData: (data: EmployeeFormData) => void;
  locationAssignments: LocationAssignment[];
  expandedLocations: Set<string>;
  locations: Location[];
  activeSuppliers: Supplier[];
  onSubmit: () => void;
  isSubmitting: boolean;
  onToggleLocation: (locationId: string) => void;
  onToggleSupplierForLocation: (locationId: string, supplierId: string) => void;
  onSelectAllSuppliers: (locationId: string) => void;
  onDeselectAllSuppliers: (locationId: string) => void;
  onToggleExpandLocation: (locationId: string) => void;
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  editingEmployee,
  formData,
  setFormData,
  locationAssignments,
  expandedLocations,
  locations,
  activeSuppliers,
  onSubmit,
  isSubmitting,
  onToggleLocation,
  onToggleSupplierForLocation,
  onSelectAllSuppliers,
  onDeselectAllSuppliers,
  onToggleExpandLocation,
}: EmployeeFormDialogProps) {
  const { t } = useTranslation();

  const isSubmitDisabled = !formData.name.trim() || 
    (formData.autoApprove && !editingEmployee?.pin_code && formData.pinCode.length !== 4) || 
    isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle>
            {editingEmployee ? 'Mitarbeiter bearbeiten' : 'Neuen Mitarbeiter anlegen'}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto px-6" style={{ maxHeight: 'calc(85vh - 150px)' }}>
          <div className="space-y-4 pb-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Somchai"
              />
            </div>
            
            {/* Phone */}
            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 151 12345678"
              />
            </div>
            
            {/* Email */}
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mitarbeiter@example.com"
              />
            </div>

            {/* Language Selection */}
            <div>
              <Label>Sprache für Easy Order</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
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

            {/* Location + Supplier Assignment */}
            {locations.length > 0 ? (
              <div>
                <Label className="mb-2 block">Standorte & Lieferanten</Label>
                <div className="border rounded-lg divide-y">
                  {locations.map((location) => {
                    const assignment = locationAssignments.find(a => a.locationId === location.id);
                    const isEnabled = assignment?.enabled ?? false;
                    const isExpanded = expandedLocations.has(location.id);
                    const selectedCount = assignment?.supplierIds.length ?? 0;

                    return (
                      <div key={location.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`location-${location.id}`}
                              checked={isEnabled}
                              onCheckedChange={() => onToggleLocation(location.id)}
                            />
                            <label
                              htmlFor={`location-${location.id}`}
                              className="text-base font-semibold cursor-pointer"
                            >
                              {location.short_code || location.name}
                            </label>
                            {isEnabled && (
                              <Badge variant="secondary" className="text-xs">
                                {selectedCount}/{activeSuppliers.length}
                              </Badge>
                            )}
                          </div>
                          {isEnabled && activeSuppliers.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onToggleExpandLocation(location.id)}
                              className="h-7 w-7 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {isEnabled && isExpanded && activeSuppliers.length > 0 && (
                          <div className="mt-3 ml-6 space-y-2">
                            <div className="flex gap-2 mb-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onSelectAllSuppliers(location.id)}
                                className="text-xs h-6"
                              >
                                Alle
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onDeselectAllSuppliers(location.id)}
                                className="text-xs h-6"
                              >
                                Keine
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {activeSuppliers.map((supplier) => (
                                <div key={supplier.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`supplier-${location.id}-${supplier.id}`}
                                    checked={assignment?.supplierIds.includes(supplier.id) ?? false}
                                    onCheckedChange={() => onToggleSupplierForLocation(location.id, supplier.id)}
                                  />
                                  <label
                                    htmlFor={`supplier-${location.id}-${supplier.id}`}
                                    className="text-xs cursor-pointer truncate"
                                  >
                                    {supplier.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {locationAssignments.every(a => !a.enabled) && (
                  <p className="text-xs text-amber-600 mt-1">
                    Ohne Standortzuweisung kann der Mitarbeiter keine Bestellungen aufgeben
                  </p>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/50">
                <Label className="mb-2 block text-muted-foreground">Standorte & Lieferanten</Label>
                <p className="text-sm text-muted-foreground">
                  Noch keine Standorte angelegt.{' '}
                  <a href="/settings?tab=locations" className="text-primary underline">
                    Standort in den Einstellungen anlegen
                  </a>
                </p>
              </div>
            )}

            {/* Auto-Approve Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label htmlFor="auto-approve" className="text-sm font-medium">
                  Bestellungen automatisch freigeben
                </Label>
                <p className="text-xs text-muted-foreground">
                  EasyOrder-Bestellungen werden direkt an den Lieferanten gesendet
                </p>
              </div>
              <Switch
                id="auto-approve"
                checked={formData.autoApprove}
                onCheckedChange={(checked) => setFormData({ ...formData, autoApprove: checked, pinCode: checked ? formData.pinCode : '' })}
              />
            </div>

            {/* PIN Code */}
            {formData.autoApprove && (
              <div className={`p-3 border rounded-lg space-y-3 ${!editingEmployee && formData.pinCode.length !== 4 ? 'border-destructive/50 bg-destructive/5' : 'bg-muted/30'}`}>
                <div className="space-y-0.5">
                  <Label htmlFor="pin-code" className="text-sm font-medium flex items-center gap-1">
                    PIN-Code {!editingEmployee && <span className="text-destructive">*</span>}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {editingEmployee?.pin_code 
                      ? 'Leer lassen um bestehenden PIN zu behalten, oder neuen 4-stelligen Code eingeben'
                      : '4-stelliger Code, den der Mitarbeiter eingeben muss'}
                  </p>
                </div>
                {editingEmployee?.pin_code && !formData.pinCode && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Shield className="w-4 h-4" />
                    <span>PIN bereits gesetzt (••••)</span>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <Input
                    id="pin-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]*"
                    value={formData.pinCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setFormData({ ...formData, pinCode: value });
                    }}
                    placeholder={editingEmployee?.pin_code ? 'Neuer PIN...' : 'z.B. 1234'}
                    className={`w-32 font-mono text-center tracking-widest ${!editingEmployee && formData.pinCode.length !== 4 ? 'border-destructive' : ''}`}
                  />
                </div>
                {!editingEmployee && formData.pinCode.length !== 4 && (
                  <p className="text-xs text-destructive">
                    PIN muss genau 4 Ziffern haben
                  </p>
                )}
                {formData.pinCode.length > 0 && formData.pinCode.length !== 4 && (
                  <p className="text-xs text-amber-600">
                    PIN muss genau 4 Ziffern haben
                  </p>
                )}
              </div>
            )}

            {/* Voice Input Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="voice-input" className="text-sm font-medium">
                      {t('settings.employees.voiceInput', 'Voice Input')}
                    </Label>
                    <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      {t('voice.prototype', 'Prototype')}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.employees.voiceInputDescription', 'Place orders by voice (Whisper + AI)')}
                  </p>
                </div>
              </div>
              <Switch
                id="voice-input"
                checked={formData.voiceInputEnabled}
                onCheckedChange={(checked) => setFormData({ ...formData, voiceInputEnabled: checked })}
              />
            </div>

            {/* Free Items Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="free-items" className="text-sm font-medium">
                    {t('settings.employees.canAddFreeItems', 'Freie Artikel erlauben')}
                  </Label>
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Neu
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('settings.employees.canAddFreeItemsDescription', 'Mitarbeiter kann freie Artikel zur Bestellung hinzufügen')}
                </p>
              </div>
              <Switch
                id="free-items"
                checked={formData.canAddFreeItems}
                onCheckedChange={(checked) => setFormData({ ...formData, canAddFreeItems: checked })}
              />
            </div>

            {/* Photo Capture Toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="photo-capture" className="text-sm font-medium">
                      {t('settings.employees.canCapturePhotos', 'Foto-Erfassung')}
                    </Label>
                    <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      Neu
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.employees.canCapturePhotosDescription', 'Mitarbeiter kann Artikelfotos erfassen und zuweisen')}
                  </p>
                </div>
              </div>
              <Switch
                id="photo-capture"
                checked={formData.canCapturePhotos}
                onCheckedChange={(checked) => setFormData({ ...formData, canCapturePhotos: checked })}
              />
            </div>

            {/* Wine Catalog Access */}
            <div className="p-3 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="wine-access" className="text-sm font-medium">
                    {t('settings.employees.wineCatalogAccess', 'Weinkarten-Zugang')}
                  </Label>
                  <Badge variant="outline" className="text-xs bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                    <Wine className="h-3 w-3 mr-1" />
                    Wein
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {t('settings.employees.wineCatalogAccessDescription', 'Weinkarte über Easy Order anzeigen oder bearbeiten')}
                </p>
                <Select
                  value={formData.wineCatalogAccess}
                  onValueChange={(value: 'none' | 'view' | 'edit') => setFormData({ ...formData, wineCatalogAccess: value })}
                >
                  <SelectTrigger id="wine-access" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('settings.employees.wineCatalogNone', 'Kein Zugang')}</SelectItem>
                    <SelectItem value="view">{t('settings.employees.wineCatalogView', 'Nur ansehen')}</SelectItem>
                    <SelectItem value="edit">{t('settings.employees.wineCatalogEdit', 'Ansehen & bearbeiten')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="z.B. Küche, nur vormittags erreichbar"
                rows={2}
              />
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-center items-center gap-6 px-6 pb-6 pt-4 border-t bg-background">
          <Button 
            type="button" 
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full border-2 text-muted-foreground hover:text-foreground"
            onClick={() => onOpenChange(false)}
            title="Abbrechen"
          >
            <X className="h-5 w-5" />
          </Button>
          <Button 
            type="button"
            size="icon"
            className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={onSubmit}
            disabled={isSubmitDisabled}
            title={editingEmployee ? 'Speichern' : 'Anlegen'}
          >
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
