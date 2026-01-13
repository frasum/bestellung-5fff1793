import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Merge, AlertTriangle } from 'lucide-react';
import { useMergeArticles } from '@/hooks/useMergeArticles';

interface Article {
  id: string;
  name: string;
  sku?: string | null;
  unit: string;
  price: number;
  supplier_id: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface MergeArticlesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  articles: Article[];
  preselectedSupplierId?: string | null;
}

export function MergeArticlesDialog({
  open,
  onOpenChange,
  suppliers,
  articles,
  preselectedSupplierId,
}: MergeArticlesDialogProps) {
  const { t } = useTranslation();
  const mergeArticles = useMergeArticles();
  
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(preselectedSupplierId || '');
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');

  // Synchronize selectedSupplierId when dialog opens with preselectedSupplierId
  useEffect(() => {
    if (open && preselectedSupplierId) {
      setSelectedSupplierId(preselectedSupplierId);
    }
  }, [open, preselectedSupplierId]);

  // Filter articles by selected supplier
  const supplierArticles = useMemo(() => {
    if (!selectedSupplierId) return [];
    return articles.filter(a => a.supplier_id === selectedSupplierId);
  }, [articles, selectedSupplierId]);

  // Get source and target article objects
  const sourceArticle = supplierArticles.find(a => a.id === sourceId);
  const targetArticle = supplierArticles.find(a => a.id === targetId);

  const canMerge = sourceId && targetId && sourceId !== targetId;

  const handleMerge = async () => {
    if (!canMerge) return;
    
    await mergeArticles.mutateAsync({
      sourceId,
      targetId,
    });
    
    handleClose();
  };

  const handleClose = () => {
    setSourceId('');
    setTargetId('');
    if (!preselectedSupplierId) {
      setSelectedSupplierId('');
    }
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      if (preselectedSupplierId) {
        setSelectedSupplierId(preselectedSupplierId);
      }
      onOpenChange(true);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            {t('articles.mergeTitle', 'Artikel zusammenführen')}
          </DialogTitle>
          <DialogDescription>
            {t('articles.mergeDescription', 'Führen Sie zwei Artikel zusammen. Der Quell-Artikel wird gelöscht und alle verknüpften Daten werden auf den Ziel-Artikel übertragen.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Supplier Selection (if not preselected) */}
          {!preselectedSupplierId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('common.supplier', 'Lieferant')}
              </label>
              <Select value={selectedSupplierId} onValueChange={(value) => {
                setSelectedSupplierId(value);
                setSourceId('');
                setTargetId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('articles.selectSupplier', 'Lieferant auswählen')} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Source Article Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-destructive">
              {t('articles.sourceArticle', 'Quell-Artikel (wird gelöscht)')}
            </label>
            <Select 
              value={sourceId} 
              onValueChange={setSourceId}
              disabled={!selectedSupplierId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('articles.selectSourceArticle', 'Quell-Artikel auswählen')} />
              </SelectTrigger>
              <SelectContent>
                {supplierArticles
                  .filter(a => a.id !== targetId)
                  .map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      <div className="flex flex-col">
                        <span>{article.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {article.sku && `SKU: ${article.sku} · `}
                          {formatPrice(article.price)} / {article.unit}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Article Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">
              {t('articles.targetArticle', 'Ziel-Artikel (bleibt erhalten)')}
            </label>
            <Select 
              value={targetId} 
              onValueChange={setTargetId}
              disabled={!selectedSupplierId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('articles.selectTargetArticle', 'Ziel-Artikel auswählen')} />
              </SelectTrigger>
              <SelectContent>
                {supplierArticles
                  .filter(a => a.id !== sourceId)
                  .map((article) => (
                    <SelectItem key={article.id} value={article.id}>
                      <div className="flex flex-col">
                        <span>{article.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {article.sku && `SKU: ${article.sku} · `}
                          {formatPrice(article.price)} / {article.unit}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Alert */}
          {canMerge && sourceArticle && targetArticle && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>"{sourceArticle.name}"</strong> {t('articles.willBeMergedInto', 'wird zusammengeführt in')}{' '}
                <strong>"{targetArticle.name}"</strong>.
                <br />
                <span className="text-sm">
                  {t('articles.mergeWarning', 'Alle Bestellungen, Preishistorie und Inventurdaten werden übertragen.')}
                </span>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel', 'Abbrechen')}
          </Button>
          <Button 
            onClick={handleMerge} 
            disabled={!canMerge || mergeArticles.isPending}
            variant="destructive"
          >
            {mergeArticles.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.merging', 'Zusammenführen...')}
              </>
            ) : (
              <>
                <Merge className="w-4 h-4 mr-2" />
                {t('common.merge', 'Zusammenführen')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
