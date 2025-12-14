import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Clock, Camera, Trash2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SupplierUnitSelect } from './SupplierUnitSelect';
import { compressImage } from '@/lib/imageCompression';

import { SupplierOrderUnitSelect } from './SupplierOrderUnitSelect';

interface Article {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  price: number;
  category: string | null;
  is_active: boolean;
  annual_order_value: number | null;
  packaging_unit: number | null;
  reference_price: number | null;
  reference_unit: string | null;
  image_url?: string | null;
}

interface PendingChange {
  id: string;
  article_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  created_at: string;
}

interface Unit {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface SupplierArticleCardProps {
  article: Article;
  editedArticles: Record<string, Partial<Article>>;
  priceInputs: Record<string, string>;
  annualOrderValueInputs: Record<string, string>;
  orderUnitInputs: Record<string, string>;
  referencePriceInputs: Record<string, string>;
  pendingChanges: PendingChange[];
  saving: string | null;
  units: Unit[];
  categories: Category[];
  visibleColumns?: string[];
  isMissingAnnualValue?: boolean;
  uploadingImage?: string | null;
  onFieldChange: (articleId: string, field: keyof Article, value: any) => void;
  onPriceChange: (articleId: string, value: string) => void;
  onAnnualOrderValueChange: (articleId: string, value: string) => void;
  onOrderUnitChange: (articleId: string, value: string) => void;
  onReferencePriceChange: (articleId: string, value: string) => void;
  onSave: (articleId: string) => void;
  onCreateUnit: (name: string) => Promise<void>;
  onCreateCategory: (name: string) => Promise<void>;
  onImageUpload?: (articleId: string, base64Image: string) => Promise<void>;
  onImageDelete?: (articleId: string) => Promise<void>;
}

export function SupplierArticleCard({
  article,
  editedArticles,
  priceInputs,
  annualOrderValueInputs,
  orderUnitInputs,
  referencePriceInputs,
  pendingChanges,
  saving,
  units,
  categories,
  visibleColumns,
  isMissingAnnualValue = false,
  uploadingImage,
  onFieldChange,
  onPriceChange,
  onAnnualOrderValueChange,
  onOrderUnitChange,
  onReferencePriceChange,
  onSave,
  onCreateUnit,
  onCreateCategory,
  onImageUpload,
  onImageDelete,
}: SupplierArticleCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  
  const defaultVisibleColumns = ['sku', 'description', 'unit', 'packaging_unit', 'price', 'annual_order_value'];
  const cols = visibleColumns || defaultVisibleColumns;
  const isVisible = (col: string) => cols.includes(col);
  
  const displayImageUrl = localImagePreview || article.image_url;
  const isUploading = uploadingImage === article.id;
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;
    
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setLocalImagePreview(base64);
      
      try {
        // Compress image before upload (max 1200px, 80% quality)
        const compressedImage = await compressImage(base64, 1200, 1200, 0.8);
        await onImageUpload(article.id, compressedImage);
      } catch (error) {
        console.error('Image compression/upload failed:', error);
        // Reset preview on error
        setLocalImagePreview(null);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input for re-selection
    e.target.value = '';
  };
  
  const handleDeleteImage = async () => {
    if (!onImageDelete) return;
    setLocalImagePreview(null);
    await onImageDelete(article.id);
  };
  const getDisplayValue = (field: keyof Article) => {
    if (editedArticles[article.id]?.[field] !== undefined) {
      return editedArticles[article.id][field];
    }
    return article[field];
  };

  const hasChanges = () => {
    const hasFieldChanges = !!editedArticles[article.id] && Object.keys(editedArticles[article.id]).length > 0;
    const hasPriceChange = priceInputs[article.id] !== undefined;
    const hasAOVChange = annualOrderValueInputs[article.id] !== undefined;
    const hasPUChange = orderUnitInputs[article.id] !== undefined;
    const hasRefPriceChange = referencePriceInputs[article.id] !== undefined;
    return hasFieldChanges || hasPriceChange || hasAOVChange || hasPUChange || hasRefPriceChange;
  };

  const getPendingChangesForArticle = () => {
    return pendingChanges.filter(c => c.article_id === article.id && c.status === 'pending');
  };

  const getPendingChangeForField = (fieldName: string) => {
    return pendingChanges.find(
      c => c.article_id === article.id && c.field_name === fieldName && c.status === 'pending'
    );
  };

  const hasPendingChange = (fieldName: string) => {
    return !!getPendingChangeForField(fieldName);
  };

  const articlePendingChanges = getPendingChangesForArticle();
  const hasPending = articlePendingChanges.length > 0;

  return (
    <Card className={cn(
      "p-4",
      hasPending && "ring-2 ring-amber-500/50",
      hasChanges() && "ring-2 ring-primary/50",
      isMissingAnnualValue && !hasPending && !hasChanges() && "ring-2 ring-destructive/50"
    )}>
      {/* Product Image */}
      {onImageUpload && (
        <div className="mb-4">
          <label className="text-xs text-muted-foreground font-medium">Produktfoto</label>
          <div className="mt-1 border rounded-lg overflow-hidden bg-muted/30">
            {displayImageUrl ? (
              <div className="relative">
                <img 
                  src={displayImageUrl} 
                  alt={article.name}
                  className="w-full aspect-[4/3] object-contain bg-muted/50" 
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  {onImageDelete && (
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8"
                      onClick={handleDeleteImage}
                      disabled={isUploading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div 
                className={cn(
                  "aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
                  isUploading && "pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Foto hinzufügen</span>
                  </>
                )}
              </div>
            )}
          </div>
          <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base break-words">{article.name}</h3>
          {article.sku && (
            <p className="text-xs text-muted-foreground mt-0.5">SKU: {article.sku}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="secondary" className="whitespace-nowrap">
            {article.price.toFixed(2).replace('.', ',')} €
          </Badge>
          {hasPending && (
            <Badge variant="outline" className="text-amber-600 border-amber-500 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {articlePendingChanges.length} ausstehend
            </Badge>
          )}
        </div>
      </div>

      {/* Editable Fields */}
      <div className="space-y-3">
        {/* SKU */}
        {isVisible('sku') && (
          <div>
            <label className="text-xs text-muted-foreground font-medium">SKU</label>
            <Input
              value={(getDisplayValue('sku') as string) || ''}
              onChange={(e) => onFieldChange(article.id, 'sku', e.target.value || null)}
              className={cn("h-11 mt-1", hasPendingChange('sku') && "border-amber-500")}
              placeholder="—"
            />
            {getPendingChangeForField('sku') && (
              <p className="text-xs mt-1">
                <span className="text-amber-600">Ausstehend</span>
                <span className="text-muted-foreground ml-1">
                  (vorher: {getPendingChangeForField('sku')?.old_value || '—'})
                </span>
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {isVisible('description') && (
          <div>
            <label className="text-xs text-muted-foreground font-medium">Beschreibung</label>
            <Input
              value={(getDisplayValue('description') as string) || ''}
              onChange={(e) => onFieldChange(article.id, 'description', e.target.value || null)}
              className={cn("h-11 mt-1", hasPendingChange('description') && "border-amber-500")}
              placeholder="—"
            />
            {getPendingChangeForField('description') && (
              <p className="text-xs mt-1">
                <span className="text-amber-600">Ausstehend</span>
                <span className="text-muted-foreground ml-1">
                  (vorher: {getPendingChangeForField('description')?.old_value || '—'})
                </span>
              </p>
            )}
          </div>
        )}

        {/* Row 1: Einheit + Preis */}
        {(isVisible('unit') || isVisible('price')) && (
          <div className="grid grid-cols-2 gap-3">
            {isVisible('unit') && (
              <div>
                <label className="text-xs text-muted-foreground font-medium">Einheit</label>
                <div className="mt-1">
                  <SupplierUnitSelect
                    value={getDisplayValue('unit') as string}
                    units={units}
                    onChange={(value) => onFieldChange(article.id, 'unit', value)}
                    onCreateUnit={onCreateUnit}
                    hasPending={hasPendingChange('unit')}
                    pendingInfo={getPendingChangeForField('unit')}
                    className="h-11"
                  />
                </div>
              </div>
            )}
            {isVisible('price') && (
              <div>
                <label className="text-xs text-muted-foreground font-medium">Preis (€)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={priceInputs[article.id] !== undefined 
                    ? priceInputs[article.id]
                    : getPendingChangeForField('price')?.new_value?.replace('.', ',') 
                      ?? String(article.price).replace('.', ',')}
                  onChange={(e) => onPriceChange(article.id, e.target.value)}
                  className={cn("h-11 mt-1", hasPendingChange('price') && "border-amber-500")}
                />
                {getPendingChangeForField('price') && (
                  <p className="text-xs mt-1">
                    <span className="text-amber-600">Ausstehend</span>
                    <span className="text-muted-foreground ml-1">
                      (vorher: {getPendingChangeForField('price')?.old_value?.replace('.', ',') || '—'} €)
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Row 2: BE + Bestellwert */}
        {(isVisible('packaging_unit') || isVisible('annual_order_value')) && (
          <div className="grid grid-cols-2 gap-3">
            {isVisible('packaging_unit') && (
              <div>
                <label className="text-xs text-muted-foreground font-medium">BE</label>
                <div className="mt-1">
                  <SupplierOrderUnitSelect
                    value={orderUnitInputs[article.id] !== undefined 
                      ? orderUnitInputs[article.id]
                      : getPendingChangeForField('packaging_unit')?.new_value 
                        ?? (article.packaging_unit !== null ? String(article.packaging_unit) : '')}
                    onChange={(value) => onOrderUnitChange(article.id, value)}
                    hasPending={hasPendingChange('packaging_unit')}
                    pendingInfo={getPendingChangeForField('packaging_unit')}
                    className="h-11"
                  />
                </div>
              </div>
            )}
            {isVisible('annual_order_value') && (
              <div>
                <label className="text-xs text-muted-foreground font-medium">Bestellwert (365T)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={annualOrderValueInputs[article.id] !== undefined 
                    ? annualOrderValueInputs[article.id]
                    : getPendingChangeForField('annual_order_value')?.new_value?.replace('.', ',') 
                      ?? (article.annual_order_value !== null ? String(article.annual_order_value).replace('.', ',') : '')}
                  onChange={(e) => onAnnualOrderValueChange(article.id, e.target.value)}
                  className={cn(
                    "h-11 mt-1",
                    hasPendingChange('annual_order_value') && "border-amber-500",
                    isMissingAnnualValue && "border-destructive ring-1 ring-destructive/30"
                  )}
                  placeholder="Optional"
                />
                {isMissingAnnualValue && !getPendingChangeForField('annual_order_value') && (
                  <p className="text-xs mt-1 text-destructive">Pflichtfeld</p>
                )}
                {getPendingChangeForField('annual_order_value') && (
                  <p className="text-xs mt-1">
                    <span className="text-amber-600">Ausstehend</span>
                    <span className="text-muted-foreground ml-1">
                      (vorher: {getPendingChangeForField('annual_order_value')?.old_value?.replace('.', ',') || '—'} €)
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}


        {/* Reference Price */}
        {(isVisible('reference_price') || isVisible('reference_unit')) && (
          <div className="grid grid-cols-2 gap-3">
            {isVisible('reference_price') && (
              <div>
                <label className="text-xs text-muted-foreground font-medium">Referenzpreis (€)</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={referencePriceInputs[article.id] !== undefined 
                    ? referencePriceInputs[article.id]
                    : getPendingChangeForField('reference_price')?.new_value?.replace('.', ',') 
                      ?? (article.reference_price !== null ? String(article.reference_price).replace('.', ',') : '')}
                  onChange={(e) => onReferencePriceChange(article.id, e.target.value)}
                  className={cn("h-11 mt-1", hasPendingChange('reference_price') && "border-amber-500")}
                  placeholder="z.B. 10,00"
                />
                {getPendingChangeForField('reference_price') && (
                  <p className="text-xs mt-1">
                    <span className="text-amber-600">Ausstehend</span>
                    <span className="text-muted-foreground ml-1">
                      (vorher: {getPendingChangeForField('reference_price')?.old_value?.replace('.', ',') || '—'} €)
                    </span>
                  </p>
                )}
              </div>
            )}
            {isVisible('reference_unit') && (
              <div>
                <label className="text-xs text-muted-foreground font-medium">Referenzeinheit</label>
                <Input
                  value={(getDisplayValue('reference_unit') as string) || ''}
                  onChange={(e) => onFieldChange(article.id, 'reference_unit', e.target.value || null)}
                  className={cn("h-11 mt-1", hasPendingChange('reference_unit') && "border-amber-500")}
                  placeholder="z.B. kg, L"
                />
                {getPendingChangeForField('reference_unit') && (
                  <p className="text-xs mt-1">
                    <span className="text-amber-600">Ausstehend</span>
                    <span className="text-muted-foreground ml-1">
                      (vorher: {getPendingChangeForField('reference_unit')?.old_value || '—'})
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {(isVisible('reference_price') || isVisible('reference_unit')) && (
          <p className="text-xs text-muted-foreground">
            Referenzpreis für Preisvergleiche (z.B. €/kg)
          </p>
        )}
      </div>

      {/* Save Button */}
      <Button
        onClick={() => onSave(article.id)}
        disabled={!hasChanges() || saving === article.id}
        className="w-full mt-4 h-12"
      >
        {saving === article.id ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="h-4 w-4 mr-2" />
            Änderungen einreichen
          </>
        )}
      </Button>
    </Card>
  );
}