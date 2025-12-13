import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RotateCcw, ShoppingCart, Plus, Minus, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MatchedItem {
  article_id: string;
  name: string;
  quantity: number;
  confidence: 'high' | 'medium' | 'low';
  unit: string;
}

interface Article {
  id: string;
  name: string;
  unit: string;
  order_unit_name?: string;
}

interface VoiceOrderResultsProps {
  transcript: string;
  items: MatchedItem[];
  articles: Article[];
  onConfirm: (items: MatchedItem[]) => void;
  onRetry: () => void;
  onBack: () => void;
}

export function VoiceOrderResults({
  transcript,
  items: initialItems,
  articles,
  onConfirm,
  onRetry,
  onBack,
}: VoiceOrderResultsProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<MatchedItem[]>(initialItems);

  const updateQuantity = (articleId: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.article_id === articleId
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    ));
  };

  const removeItem = (articleId: string) => {
    setItems(prev => prev.filter(item => item.article_id !== articleId));
  };

  const validItems = items.filter(item => item.quantity > 0);
  const hasItems = validItems.length > 0;

  const getConfidenceIcon = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'low':
        return <HelpCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getConfidenceClass = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30';
      case 'medium':
        return 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30';
      case 'low':
        return 'border-destructive/30 bg-destructive/5';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">
          {t('voice.results', 'Recognized Order')}
        </h1>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="p-4 bg-muted/50 border-b">
          <p className="text-sm text-muted-foreground mb-1">
            {t('voice.youSaid', 'You said:')}
          </p>
          <p className="text-sm italic">"{transcript}"</p>
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('voice.noItemsRecognized', 'No items could be recognized')}
            </p>
            <Button variant="outline" onClick={onRetry} className="mt-4">
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('voice.tryAgain', 'Try again')}
            </Button>
          </div>
        ) : (
          items.map(item => (
            <Card
              key={item.article_id}
              className={cn(
                "p-4 transition-all",
                getConfidenceClass(item.confidence),
                item.quantity === 0 && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Confidence indicator */}
                <div className="flex-shrink-0">
                  {getConfidenceIcon(item.confidence)}
                </div>

                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.unit}</p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => updateQuantity(item.article_id, -1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <span className="w-8 text-center font-semibold text-lg">
                    {item.quantity}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => updateQuantity(item.article_id, 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Low confidence hint */}
              {item.confidence === 'low' && (
                <p className="text-xs text-destructive mt-2">
                  {t('voice.lowConfidenceHint', 'This match is uncertain. Please verify.')}
                </p>
              )}
            </Card>
          ))
        )}

        {/* Legend */}
        {items.length > 0 && (
          <div className="pt-4 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Check className="h-3 w-3 text-green-600" />
              {t('voice.highConfidence', 'High confidence')}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              {t('voice.mediumConfidence', 'Please verify')}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <HelpCircle className="h-3 w-3 text-destructive" />
              {t('voice.lowConfidence', 'Uncertain match')}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 pb-safe border-t space-y-2">
        <Button
          className="w-full h-14 text-lg"
          disabled={!hasItems}
          onClick={() => onConfirm(validItems)}
        >
          <ShoppingCart className="h-5 w-5 mr-2" />
          {t('voice.addToCart', 'Add to cart')}
          {hasItems && ` (${validItems.length})`}
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={onRetry}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('voice.retry', 'Retry')}
          </Button>
          <Button variant="ghost" className="flex-1 h-12" onClick={onBack}>
            {t('voice.cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
