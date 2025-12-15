import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Edit2, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ExtractedArticle } from './VoiceInventoryCapture';

interface VoiceInventoryResultsProps {
  transcript: string;
  articles: ExtractedArticle[];
  categories: string[];
  units: string[];
  onConfirm: (articles: ExtractedArticle[]) => void;
  onRetry: () => void;
}

export function VoiceInventoryResults({
  transcript,
  articles: initialArticles,
  categories,
  units,
  onConfirm,
  onRetry,
}: VoiceInventoryResultsProps) {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<ExtractedArticle[]>(initialArticles);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpdateArticle = (index: number, updates: Partial<ExtractedArticle>) => {
    setArticles(prev => prev.map((article, i) => 
      i === index ? { ...article, ...updates } : article
    ));
  };

  const handleRemoveArticle = (index: number) => {
    setArticles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const validArticles = articles.filter(a => a.name.trim());
    onConfirm(validArticles);
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-green-500/20 text-green-600 dark:text-green-400',
      medium: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
      low: 'bg-red-500/20 text-red-600 dark:text-red-400',
    };
    const labels = {
      high: t('voiceInventory.highConfidence', 'Sicher'),
      medium: t('voiceInventory.mediumConfidence', 'Unsicher'),
      low: t('voiceInventory.lowConfidence', 'Prüfen'),
    };
    return (
      <Badge variant="secondary" className={cn('text-xs', styles[confidence])}>
        {labels[confidence]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Transcript preview */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <Label className="text-xs text-muted-foreground">
          {t('voiceInventory.transcript', 'Transkript')}
        </Label>
        <p className="text-sm mt-1 italic">"{transcript}"</p>
      </div>

      {/* Articles list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {t('voiceInventory.extractedArticles', 'Erkannte Artikel')} ({articles.length})
          </Label>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t('voiceInventory.noArticlesFound', 'Keine Artikel erkannt')}</p>
            <Button variant="link" onClick={onRetry} className="mt-2">
              {t('voiceInventory.tryAgain', 'Erneut versuchen')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {articles.map((article, index) => (
              <div
                key={index}
                className={cn(
                  'p-3 rounded-lg border bg-card',
                  article.confidence === 'low' && 'border-yellow-500/50'
                )}
              >
                {editingIndex === index ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t('voiceInventory.articleName', 'Name')}</Label>
                        <Input
                          value={article.name}
                          onChange={(e) => handleUpdateArticle(index, { name: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">{t('voiceInventory.quantity', 'Menge')}</Label>
                        <Input
                          type="number"
                          value={article.quantity || ''}
                          onChange={(e) => handleUpdateArticle(index, { quantity: parseInt(e.target.value) || undefined })}
                          className="h-8 text-sm"
                          placeholder="-"
                          onFocus={(e) => e.target.select()}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{t('voiceInventory.unit', 'Einheit')}</Label>
                        <Select value={article.unit} onValueChange={(v) => handleUpdateArticle(index, { unit: v })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">{t('voiceInventory.category', 'Kategorie')}</Label>
                        <Select value={article.category} onValueChange={(v) => handleUpdateArticle(index, { category: v })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {article.size && (
                      <div>
                        <Label className="text-xs">{t('voiceInventory.size', 'Gebindegröße')}</Label>
                        <Input
                          value={article.size}
                          onChange={(e) => handleUpdateArticle(index, { size: e.target.value })}
                          className="h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{article.name}</span>
                        {getConfidenceBadge(article.confidence)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                        {article.quantity && (
                          <span>{article.quantity}×</span>
                        )}
                        <span>{article.unit}</span>
                        {article.size && (
                          <span className="text-xs">({article.size})</span>
                        )}
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingIndex(index)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveArticle(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onRetry} className="flex-1">
          <X className="h-4 w-4 mr-2" />
          {t('voiceInventory.recordAgain', 'Neu aufnehmen')}
        </Button>
        <Button 
          onClick={handleConfirm} 
          className="flex-1"
          disabled={articles.filter(a => a.name.trim()).length === 0}
        >
          <Check className="h-4 w-4 mr-2" />
          {t('voiceInventory.useArticles', 'Artikel verwenden')} ({articles.length})
        </Button>
      </div>
    </div>
  );
}
