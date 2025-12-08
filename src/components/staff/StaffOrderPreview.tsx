import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, X, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ParsedItem {
  article_id: string | null;
  article_name: string;
  quantity: number;
  recognized_text: string;
  confidence: number;
}

interface Article {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  price: number;
  suppliers?: {
    name: string;
  };
}

interface StaffOrderPreviewProps {
  items: ParsedItem[];
  transcription?: string;
  articles: Article[];
  onItemChange: (index: number, item: ParsedItem) => void;
  onItemRemove: (index: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function StaffOrderPreview({
  items,
  transcription,
  articles,
  onItemChange,
  onItemRemove,
  onSubmit,
  onCancel,
  isSubmitting,
}: StaffOrderPreviewProps) {
  const { t } = useTranslation();

  const getArticleById = (id: string | null) => {
    if (!id) return null;
    return articles.find(a => a.id === id);
  };

  const hasLowConfidenceItems = items.some(item => item.confidence < 0.7);
  const hasUnmatchedItems = items.some(item => !item.article_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bestellung prüfen</span>
          <Badge variant="secondary">{items.length} Artikel</Badge>
        </CardTitle>
        {transcription && (
          <p className="text-sm text-muted-foreground italic">
            "{transcription}"
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {(hasLowConfidenceItems || hasUnmatchedItems) && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>Einige Artikel konnten nicht eindeutig zugeordnet werden. Bitte prüfen.</span>
          </div>
        )}

        {items.map((item, index) => {
          const article = getArticleById(item.article_id);
          const isLowConfidence = item.confidence < 0.7;
          const isUnmatched = !item.article_id;

          return (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                isUnmatched ? 'border-destructive bg-destructive/5' :
                isLowConfidence ? 'border-warning bg-warning/5' : 
                'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  {/* Recognized text */}
                  <p className="text-xs text-muted-foreground">
                    Erkannt: "{item.recognized_text}"
                  </p>

                  {/* Article selector */}
                  <Select
                    value={item.article_id || ''}
                    onValueChange={(value) => {
                      const selectedArticle = articles.find(a => a.id === value);
                      onItemChange(index, {
                        ...item,
                        article_id: value || null,
                        article_name: selectedArticle?.name || item.article_name,
                        confidence: 1,
                      });
                    }}
                  >
                    <SelectTrigger className={isUnmatched ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Artikel auswählen">
                        {article ? (
                          <span className="flex items-center gap-2">
                            {article.name}
                            {article.sku && (
                              <span className="text-muted-foreground text-xs">({article.sku})</span>
                            )}
                          </span>
                        ) : (
                          'Artikel auswählen'
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {articles.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <div className="flex flex-col">
                            <span>{a.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {a.sku && `${a.sku} · `}{a.suppliers?.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Quantity and unit */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        onItemChange(index, {
                          ...item,
                          quantity: parseFloat(e.target.value) || 1,
                        });
                      }}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">
                      {article?.unit || 'Stk'}
                    </span>
                    {!isUnmatched && (
                      <Badge variant={isLowConfidence ? 'secondary' : 'default'} className="ml-auto">
                        {Math.round(item.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onItemRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Abbrechen
        </Button>
        <Button
          className="flex-1"
          onClick={onSubmit}
          disabled={isSubmitting || hasUnmatchedItems}
        >
          {isSubmitting ? (
            'Wird eingereicht...'
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Einreichen
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
