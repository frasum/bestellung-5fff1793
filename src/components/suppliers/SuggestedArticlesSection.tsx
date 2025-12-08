import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Package, MessageSquare } from 'lucide-react';
import { 
  SuggestedArticle, 
  useApproveSuggestedArticle, 
  useRejectSuggestedArticle 
} from '@/hooks/useSuggestedArticles';

interface SuggestedArticlesSectionProps {
  suggestions: SuggestedArticle[];
  isProcessing: boolean;
}

export const SuggestedArticlesSection = ({ 
  suggestions, 
  isProcessing 
}: SuggestedArticlesSectionProps) => {
  const approveSuggestion = useApproveSuggestedArticle();
  const rejectSuggestion = useRejectSuggestedArticle();

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-green-600" />
        <h3 className="font-medium">Neue Artikelvorschläge</h3>
        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          {suggestions.length} neu
        </Badge>
      </div>

      {suggestions.map((suggestion) => (
        <div 
          key={suggestion.id} 
          className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{suggestion.name}</span>
                {suggestion.sku && (
                  <Badge variant="outline" className="text-xs">
                    SKU: {suggestion.sku}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Einheit:</span> {suggestion.unit}
                </div>
                <div>
                  <span className="font-medium">Preis:</span> {suggestion.price.toFixed(2).replace('.', ',')} €
                </div>
                {suggestion.category && (
                  <div>
                    <span className="font-medium">Kategorie:</span> {suggestion.category}
                  </div>
                )}
                {suggestion.description && (
                  <div className="col-span-2 md:col-span-4">
                    <span className="font-medium">Beschreibung:</span> {suggestion.description}
                  </div>
                )}
              </div>

              {suggestion.supplier_comment && (
                <div className="flex items-start gap-2 text-sm bg-background/50 rounded p-2 mt-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground italic">
                    "{suggestion.supplier_comment}"
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => rejectSuggestion.mutate(suggestion.id)}
                disabled={isProcessing || rejectSuggestion.isPending || approveSuggestion.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-green-600 hover:text-green-600"
                onClick={() => approveSuggestion.mutate(suggestion)}
                disabled={isProcessing || rejectSuggestion.isPending || approveSuggestion.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
