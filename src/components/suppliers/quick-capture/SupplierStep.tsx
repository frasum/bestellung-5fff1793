import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Check, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Supplier } from '@/hooks/useSuppliers';

interface SupplierStepProps {
  // Queue info for batch processing
  queueLength: number;
  currentQueueIndex: number;
  
  // Supplier selection
  supplierMode: 'existing' | 'new';
  onSupplierModeChange: (mode: 'existing' | 'new') => void;
  selectedSupplierId: string;
  onSelectedSupplierChange: (id: string) => void;
  supplierSearch: string;
  onSupplierSearchChange: (value: string) => void;
  filteredSuppliers: Supplier[];
  allSuppliers: Supplier[];
  
  // New supplier form
  newSupplierName: string;
  onNewSupplierNameChange: (value: string) => void;
  newSupplierEmail: string;
  onNewSupplierEmailChange: (value: string) => void;
  newSupplierPhone: string;
  onNewSupplierPhoneChange: (value: string) => void;
  newSupplierCustomerNumber: string;
  onNewSupplierCustomerNumberChange: (value: string) => void;
  
  // Actions
  onBack: () => void;
  onSave: () => void;
  onSaveAndContinue: () => void;
  canSave: boolean;
  isSaving: boolean;
}

export const SupplierStep = memo(function SupplierStep({
  queueLength,
  currentQueueIndex,
  supplierMode,
  onSupplierModeChange,
  selectedSupplierId,
  onSelectedSupplierChange,
  supplierSearch,
  onSupplierSearchChange,
  filteredSuppliers,
  allSuppliers,
  newSupplierName,
  onNewSupplierNameChange,
  newSupplierEmail,
  onNewSupplierEmailChange,
  newSupplierPhone,
  onNewSupplierPhoneChange,
  newSupplierCustomerNumber,
  onNewSupplierCustomerNumberChange,
  onBack,
  onSave,
  onSaveAndContinue,
  canSave,
  isSaving,
}: SupplierStepProps) {
  const { t } = useTranslation();
  const isLastInQueue = queueLength <= 1 || currentQueueIndex >= queueLength - 1;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('quickCapture.supplierQuestion', 'Von welchem Lieferanten beziehst du diesen Artikel?')}
      </p>

      <RadioGroup value={supplierMode} onValueChange={(v) => onSupplierModeChange(v as 'existing' | 'new')}>
        <div className="space-y-3">
          {/* Existing supplier option */}
          <div className={cn(
            'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
            supplierMode === 'existing' ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="existing" id="existing" className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="existing" className="font-medium cursor-pointer">
                {t('quickCapture.existingSupplier', 'Bestehender Lieferant')}
              </Label>
              {supplierMode === 'existing' && (
                <div className="space-y-2">
                  <Input
                    placeholder={t('quickCapture.searchSupplier', 'Lieferant suchen...')}
                    value={supplierSearch}
                    onChange={(e) => onSupplierSearchChange(e.target.value)}
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredSuppliers.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        {allSuppliers.length === 0 
                          ? t('quickCapture.noSuppliers', 'Noch keine Lieferanten vorhanden')
                          : t('quickCapture.noSuppliersFound', 'Keine Lieferanten gefunden')}
                      </p>
                    ) : (
                      filteredSuppliers.slice(0, 5).map(supplier => (
                        <div
                          key={supplier.id}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded cursor-pointer transition-colors',
                            selectedSupplierId === supplier.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          )}
                          onClick={() => onSelectedSupplierChange(supplier.id)}
                        >
                          <Building2 className="h-4 w-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{supplier.name}</p>
                            <p className={cn(
                              'text-xs truncate',
                              selectedSupplierId === supplier.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>{supplier.email}</p>
                          </div>
                          {selectedSupplierId === supplier.id && (
                            <Check className="h-4 w-4 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* New supplier option */}
          <div className={cn(
            'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
            supplierMode === 'new' ? 'border-primary bg-primary/5' : 'border-border'
          )}>
            <RadioGroupItem value="new" id="new" className="mt-1" />
            <div className="flex-1 space-y-2">
              <Label htmlFor="new" className="font-medium cursor-pointer flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('quickCapture.newSupplier', 'Neuen Lieferanten erstellen')}
              </Label>
              {supplierMode === 'new' && (
                <div className="grid gap-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('quickCapture.companyName', 'Firmenname')} *</Label>
                    <Input
                      value={newSupplierName}
                      onChange={(e) => onNewSupplierNameChange(e.target.value)}
                      placeholder={t('quickCapture.companyNamePlaceholder', 'z.B. Metro Cash & Carry')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('quickCapture.orderEmail', 'E-Mail für Bestellungen')} *</Label>
                    <Input
                      type="email"
                      value={newSupplierEmail}
                      onChange={(e) => onNewSupplierEmailChange(e.target.value)}
                      placeholder="bestellung@lieferant.de"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('quickCapture.customerNumber', 'Ihre Kundennummer')}</Label>
                      <Input
                        value={newSupplierCustomerNumber}
                        onChange={(e) => onNewSupplierCustomerNumberChange(e.target.value)}
                        placeholder={t('quickCapture.customerNumberPlaceholder', 'z.B. K-12345')}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('quickCapture.phone', 'Telefon')}</Label>
                      <Input
                        value={newSupplierPhone}
                        onChange={(e) => onNewSupplierPhoneChange(e.target.value)}
                        placeholder={t('quickCapture.phonePlaceholder', 'Optional')}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </RadioGroup>

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Zurück')}
        </Button>
        
        {!isLastInQueue ? (
          <Button onClick={onSaveAndContinue} disabled={!canSave || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving', 'Speichern...')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('quickCapture.saveAndContinue', 'Speichern & Weiter')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        ) : (
          <Button onClick={onSave} disabled={!canSave || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.saving', 'Speichern...')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('quickCapture.saveArticle', 'Artikel speichern')}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
});
