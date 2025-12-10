import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Supplier } from '@/hooks/useSuppliers';
import { useBulkUpdateArticles } from '@/hooks/useArticles';
import { toast } from 'sonner';

interface Article {
  id: string;
  name: string;
  category: string | null;
  top_category: string | null;
  supplier_id: string;
  suppliers?: { id: string; name: string } | null;
}

interface CategoryTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  articles: Article[];
}

interface ArticleMatch {
  sourceArticle: Article;
  targetArticle: Article;
  matchScore: number;
  selected: boolean;
}

// Normalize article name for matching
const normalizeArticleName = (name: string): string => {
  return name
    .toLowerCase()
    // German umlauts
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ß/g, 'ss')
    // Remove common brand names
    .replace(/\b(cock|lobo|aroy-d|thai|asia|orient)\b/gi, '')
    // Remove quantity patterns like 12x500g, 1kg, 500ml, etc.
    .replace(/\d+\s*[x×]\s*\d+\s*(g|kg|ml|l|stk|stück|pcs)/gi, '')
    .replace(/\d+\s*(g|kg|ml|l|stk|stück|pcs)\b/gi, '')
    // Remove parentheses content
    .replace(/\([^)]*\)/g, '')
    // Normalize whitespace and special chars
    .replace(/[-_,\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Calculate Levenshtein distance
const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
};

// Calculate similarity score (0-100)
const calculateSimilarity = (str1: string, str2: string): number => {
  const normalized1 = normalizeArticleName(str1);
  const normalized2 = normalizeArticleName(str2);
  
  // Exact match after normalization
  if (normalized1 === normalized2) return 100;
  
  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const lengthRatio = Math.min(normalized1.length, normalized2.length) / 
                        Math.max(normalized1.length, normalized2.length);
    return Math.round(85 + (lengthRatio * 15));
  }
  
  // Levenshtein-based similarity
  const maxLen = Math.max(normalized1.length, normalized2.length);
  if (maxLen === 0) return 100;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const similarity = ((maxLen - distance) / maxLen) * 100;
  
  return Math.round(similarity);
};

export const CategoryTransferDialog = ({
  open,
  onOpenChange,
  suppliers,
  articles,
}: CategoryTransferDialogProps) => {
  const { t } = useTranslation();
  const bulkUpdate = useBulkUpdateArticles();
  
  const [sourceSupplier, setSourceSupplier] = useState<string>('');
  const [targetSupplier, setTargetSupplier] = useState<string>('');
  const [matches, setMatches] = useState<ArticleMatch[]>([]);
  const [matchesCalculated, setMatchesCalculated] = useState(false);

  // Get supplier names for display
  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || '';

  // Filter suppliers with categories assigned
  const suppliersWithCategories = useMemo(() => {
    const supplierIds = new Set(
      articles
        .filter(a => a.top_category || a.category)
        .map(a => a.supplier_id)
    );
    return suppliers.filter(s => supplierIds.has(s.id));
  }, [suppliers, articles]);

  // Calculate matches between source and target suppliers
  const calculateMatches = () => {
    if (!sourceSupplier || !targetSupplier) return;

    const sourceArticles = articles.filter(a => 
      a.supplier_id === sourceSupplier && (a.top_category || a.category)
    );
    const targetArticles = articles.filter(a => a.supplier_id === targetSupplier);

    const newMatches: ArticleMatch[] = [];
    const usedTargetIds = new Set<string>();

    for (const source of sourceArticles) {
      let bestMatch: { article: Article; score: number } | null = null;

      for (const target of targetArticles) {
        if (usedTargetIds.has(target.id)) continue;
        
        const score = calculateSimilarity(source.name, target.name);
        if (score >= 60 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { article: target, score };
        }
      }

      if (bestMatch) {
        usedTargetIds.add(bestMatch.article.id);
        newMatches.push({
          sourceArticle: source,
          targetArticle: bestMatch.article,
          matchScore: bestMatch.score,
          selected: bestMatch.score >= 75, // Auto-select high confidence matches
        });
      }
    }

    // Sort by match score descending
    newMatches.sort((a, b) => b.matchScore - a.matchScore);
    setMatches(newMatches);
    setMatchesCalculated(true);
  };

  // Toggle selection
  const toggleMatch = (index: number) => {
    setMatches(prev => prev.map((m, i) => 
      i === index ? { ...m, selected: !m.selected } : m
    ));
  };

  // Select/deselect all
  const selectAll = () => {
    setMatches(prev => prev.map(m => ({ ...m, selected: true })));
  };

  const deselectAll = () => {
    setMatches(prev => prev.map(m => ({ ...m, selected: false })));
  };

  // Apply categories
  const applyCategories = () => {
    const selectedMatches = matches.filter(m => m.selected);
    if (selectedMatches.length === 0) return;

    const updates = selectedMatches.map(m => ({
      id: m.targetArticle.id,
      top_category: m.sourceArticle.top_category,
      category: m.sourceArticle.category,
    }));

    // Group updates and apply
    const ids = updates.map(u => u.id);
    
    // Since we need different categories per article, update one by one
    Promise.all(
      updates.map(update => 
        new Promise<void>((resolve, reject) => {
          bulkUpdate.mutate(
            { 
              ids: [update.id], 
              updates: { 
                top_category: update.top_category, 
                category: update.category 
              } as any 
            },
            { onSuccess: () => resolve(), onError: reject }
          );
        })
      )
    ).then(() => {
      toast.success(`${selectedMatches.length} Artikel aktualisiert`);
      onOpenChange(false);
      resetState();
    }).catch(() => {
      toast.error('Fehler beim Aktualisieren');
    });
  };

  const resetState = () => {
    setSourceSupplier('');
    setTargetSupplier('');
    setMatches([]);
    setMatchesCalculated(false);
  };

  const selectedCount = matches.filter(m => m.selected).length;

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 90) return "default";
    if (score >= 75) return "secondary";
    return "outline";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetState(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Kategorien von Lieferant übernehmen</DialogTitle>
          <DialogDescription>
            Übertrage Ober- und Hauptkategorien von einem Lieferanten auf ähnliche Artikel eines anderen Lieferanten.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Supplier Selection */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Quell-Lieferant (mit Kategorien)</label>
              <Select value={sourceSupplier} onValueChange={(v) => { setSourceSupplier(v); setMatchesCalculated(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Lieferant auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliersWithCategories
                    .filter(s => s.id !== targetSupplier)
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-6" />
            
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Ziel-Lieferant</label>
              <Select value={targetSupplier} onValueChange={(v) => { setTargetSupplier(v); setMatchesCalculated(false); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Lieferant auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter(s => s.id !== sourceSupplier)
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={calculateMatches} 
              disabled={!sourceSupplier || !targetSupplier}
              className="mt-6"
            >
              Matches finden
            </Button>
          </div>

          {/* Results */}
          {matchesCalculated && (
            <>
              {matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Keine ähnlichen Artikel gefunden</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Die Artikelnamen von {getSupplierName(sourceSupplier)} und {getSupplierName(targetSupplier)} sind zu unterschiedlich.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{matches.length} Matches gefunden</Badge>
                      <Badge variant="outline">{selectedCount} ausgewählt</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={selectAll}>Alle auswählen</Button>
                      <Button variant="ghost" size="sm" onClick={deselectAll}>Keine</Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Quell-Artikel ({getSupplierName(sourceSupplier)})</TableHead>
                          <TableHead>Ziel-Artikel ({getSupplierName(targetSupplier)})</TableHead>
                          <TableHead className="w-[80px]">Match</TableHead>
                          <TableHead className="w-[120px]">Ober-Kat.</TableHead>
                          <TableHead className="w-[120px]">Haupt-Kat.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {matches.map((match, index) => (
                          <TableRow 
                            key={match.targetArticle.id}
                            className={match.selected ? 'bg-primary/5' : ''}
                          >
                            <TableCell>
                              <Checkbox
                                checked={match.selected}
                                onCheckedChange={() => toggleMatch(index)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{match.sourceArticle.name}</TableCell>
                            <TableCell>{match.targetArticle.name}</TableCell>
                            <TableCell>
                              <Badge variant={getScoreBadgeVariant(match.matchScore)}>
                                {match.matchScore}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {match.sourceArticle.top_category ? (
                                <Badge variant="outline">{match.sourceArticle.top_category}</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {match.sourceArticle.category ? (
                                <Badge variant="outline">{match.sourceArticle.category}</Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={applyCategories} 
            disabled={selectedCount === 0 || bulkUpdate.isPending}
          >
            {bulkUpdate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Übernehme...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {selectedCount} Kategorien übernehmen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
