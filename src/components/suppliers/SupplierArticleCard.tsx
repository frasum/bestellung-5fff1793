import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  price: number;
  category: string | null;
  is_active: boolean;
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

interface SupplierArticleCardProps {
  article: Article;
  editedArticles: Record<string, Partial<Article>>;
  priceInputs: Record<string, string>;
  pendingChanges: PendingChange[];
  saving: string | null;
  onFieldChange: (articleId: string, field: keyof Article, value: any) => void;
  onPriceChange: (articleId: string, value: string) => void;
  onSave: (articleId: string) => void;
}

export function SupplierArticleCard({
  article,
  editedArticles,
  priceInputs,
  pendingChanges,
  saving,
  onFieldChange,
  onPriceChange,
  onSave,
}: SupplierArticleCardProps) {
  const getDisplayValue = (field: keyof Article) => {
    if (editedArticles[article.id]?.[field] !== undefined) {
      return editedArticles[article.id][field];
    }
    return article[field];
  };

  const hasChanges = () => {
    const hasFieldChanges = !!editedArticles[article.id] && Object.keys(editedArticles[article.id]).length > 0;
    const hasPriceChange = priceInputs[article.id] !== undefined;
    return hasFieldChanges || hasPriceChange;
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
      hasChanges() && "ring-2 ring-primary/50"
    )}>
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

        {/* Description */}
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

        {/* Unit + Price Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">Einheit</label>
            <Input
              value={getDisplayValue('unit') as string}
              onChange={(e) => onFieldChange(article.id, 'unit', e.target.value)}
              className={cn("h-11 mt-1", hasPendingChange('unit') && "border-amber-500")}
            />
            {getPendingChangeForField('unit') && (
              <p className="text-xs mt-1">
                <span className="text-amber-600">Ausstehend</span>
                <span className="text-muted-foreground ml-1">
                  (vorher: {getPendingChangeForField('unit')?.old_value || '—'})
                </span>
              </p>
            )}
          </div>
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
        </div>

        {/* Category (read-only) */}
        <div>
          <label className="text-xs text-muted-foreground font-medium">Kategorie</label>
          <p className="text-sm mt-1 py-2">{article.category || '—'}</p>
        </div>
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
