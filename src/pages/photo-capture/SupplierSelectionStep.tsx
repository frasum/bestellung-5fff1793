import { useTranslation } from 'react-i18next';
import { ChevronLeft, Check, Loader2, Building2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Supplier } from './types';
import { BatchArticleData } from '@/components/suppliers/ArticleCarousel';

interface SupplierSelectionStepProps {
  batchMode: boolean;
  batchArticles: BatchArticleData[];
  suppliers: Supplier[];
  filteredSuppliers: Supplier[];
  supplierMode: 'existing' | 'new';
  setSupplierMode: (mode: 'existing' | 'new') => void;
  supplierSearch: string;
  setSupplierSearch: (search: string) => void;
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
  newSupplierName: string;
  setNewSupplierName: (name: string) => void;
  newSupplierEmail: string;
  setNewSupplierEmail: (email: string) => void;
  newSupplierPhone: string;
  setNewSupplierPhone: (phone: string) => void;
  newSupplierCustomerNumber: string;
  setNewSupplierCustomerNumber: (num: string) => void;
  canSave: boolean;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
}

export const SupplierSelectionStep = ({
  batchMode,
  batchArticles,
  suppliers,
  filteredSuppliers,
  supplierMode,
  setSupplierMode,
  supplierSearch,
  setSupplierSearch,
  selectedSupplierId,
  setSelectedSupplierId,
  newSupplierName,
  setNewSupplierName,
  newSupplierEmail,
  setNewSupplierEmail,
  newSupplierPhone,
  setNewSupplierPhone,
  newSupplierCustomerNumber,
  setNewSupplierCustomerNumber,
  canSave,
  isSaving,
  onBack,
  onSave,
}: SupplierSelectionStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {batchMode && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {t('batchCapture.supplierForAll', '{{count}} Artikel werden diesem Lieferanten zugeordnet', { 
              count: batchArticles.filter(a => !a.skipped && a.name.trim() && a.price).length 
            })}
          </p>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        {t('quickCapture.supplierQuestion', 'Von welchem Lieferanten beziehst du diesen Artikel?')}
      </p>

      <RadioGroup value={supplierMode} onValueChange={(v) => setSupplierMode(v as 'existing' | 'new')}>
        <div className="space-y-3">
          {/* Existing Supplier */}
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
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="h-12"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredSuppliers.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2">
                        {suppliers.length === 0 
                          ? t('quickCapture.noSuppliers', 'Noch keine Lieferanten vorhanden')
                          : t('quickCapture.noSuppliersFound', 'Keine Lieferanten gefunden')}
                      </p>
                    ) : (
                      filteredSuppliers.map(supplier => (
                        <div
                          key={supplier.id}
                          className={cn(
                            'flex items-center gap-2 p-3 rounded cursor-pointer transition-colors min-h-[52px]',
                            selectedSupplierId === supplier.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          )}
                          onClick={() => setSelectedSupplierId(supplier.id)}
                        >
                          <Building2 className="h-5 w-5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{supplier.name}</p>
                            <p className={cn(
                              'text-xs truncate',
                              selectedSupplierId === supplier.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            )}>{supplier.email}</p>
                          </div>
                          {selectedSupplierId === supplier.id && (
                            <Check className="h-5 w-5 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* New Supplier */}
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
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      placeholder={t('quickCapture.companyNamePlaceholder', 'z.B. Metro Cash & Carry')}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('quickCapture.orderEmail', 'E-Mail für Bestellungen')} *</Label>
                    <Input
                      type="email"
                      value={newSupplierEmail}
                      onChange={(e) => setNewSupplierEmail(e.target.value)}
                      placeholder="bestellung@lieferant.de"
                      className="h-12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('quickCapture.customerNumber', 'Ihre Kundennummer')}</Label>
                      <Input
                        value={newSupplierCustomerNumber}
                        onChange={(e) => setNewSupplierCustomerNumber(e.target.value)}
                        placeholder={t('quickCapture.customerNumberPlaceholder', 'z.B. K-12345')}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t('quickCapture.phone', 'Telefon')}</Label>
                      <Input
                        value={newSupplierPhone}
                        onChange={(e) => setNewSupplierPhone(e.target.value)}
                        placeholder={t('quickCapture.phonePlaceholder', 'Optional')}
                        className="h-12"
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
        <Button variant="ghost" size="lg" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('common.back', 'Zurück')}
        </Button>
        <Button 
          size="lg" 
          onClick={onSave} 
          disabled={!canSave || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('common.saving', 'Speichern...')}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              {batchMode 
                ? t('batchCapture.saveAll', 'Alle speichern')
                : t('quickCapture.saveArticle', 'Artikel speichern')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
