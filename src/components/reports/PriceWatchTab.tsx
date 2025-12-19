import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  usePriceWatchResults, 
  usePriceWatchSettings,
  useDismissResult,
  useMarkAsReviewed,
  useRunPriceSearch
} from '@/hooks/usePriceWatch';
import { useOrganization } from '@/hooks/useSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Search, 
  TrendingDown, 
  ExternalLink, 
  Check, 
  X, 
  RefreshCw,
  Loader2,
  Euro,
  Percent,
  Package,
  Filter,
  ChevronDown,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { KroeswangCatalogSearch } from './KroeswangCatalogSearch';

export const PriceWatchTab = () => {
  const { t } = useTranslation();
  const { data: results, isLoading } = usePriceWatchResults();
  const { data: settings } = usePriceWatchSettings();
  const { data: organization } = useOrganization();
  const dismissResult = useDismissResult();
  const markAsReviewed = useMarkAsReviewed();
  const runPriceSearch = useRunPriceSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [minSavingsFilter, setMinSavingsFilter] = useState<string>('all');
  const [showCatalogSearch, setShowCatalogSearch] = useState(false);

  // Get unique categories
  const categories = useMemo(() => {
    if (!results) return [];
    const cats = new Set(results.map(r => r.article_category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [results]);

  // Filter results
  const filteredResults = useMemo(() => {
    if (!results) return [];
    
    return results.filter(result => {
      // Status filter
      if (statusFilter === 'active' && (result.is_dismissed || result.is_reviewed)) return false;
      if (statusFilter === 'reviewed' && !result.is_reviewed) return false;
      if (statusFilter === 'dismissed' && !result.is_dismissed) return false;

      // Category filter
      if (categoryFilter !== 'all' && result.article_category !== categoryFilter) return false;

      // Minimum savings filter
      if (minSavingsFilter !== 'all') {
        const minPercent = parseInt(minSavingsFilter);
        if (result.savings_percent < minPercent) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          result.article_name.toLowerCase().includes(query) ||
          result.found_supplier.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [results, searchQuery, categoryFilter, statusFilter, minSavingsFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    const activeResults = results?.filter(r => !r.is_dismissed && !r.is_reviewed) || [];
    return {
      count: activeResults.length,
      totalSavings: activeResults.reduce((sum, r) => sum + r.savings_amount, 0),
      avgSavingsPercent: activeResults.length > 0
        ? activeResults.reduce((sum, r) => sum + r.savings_percent, 0) / activeResults.length
        : 0,
    };
  }, [results]);

  const handleRunSearch = () => {
    if (!organization?.id) return;
    runPriceSearch.mutate({ 
      organization_id: organization.id,
      max_articles: 20 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Einsparmöglichkeiten
                </p>
                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {totals.count}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Potentielle Ersparnis
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                  €{totals.totalSavings.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <Euro className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                  Durchschnittliche Ersparnis
                </p>
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {totals.avgSavingsPercent.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Percent className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-500" />
              Gefundene Alternativen
            </CardTitle>
            <Button 
              onClick={handleRunSearch}
              disabled={runPriceSearch.isPending || !organization?.id}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {runPriceSearch.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Preise jetzt prüfen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="reviewed">Geprüft</SelectItem>
                <SelectItem value="dismissed">Ignoriert</SelectItem>
                <SelectItem value="all">Alle</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={minSavingsFilter} onValueChange={setMinSavingsFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Min. Ersparnis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="5">≥ 5%</SelectItem>
                <SelectItem value="10">≥ 10%</SelectItem>
                <SelectItem value="15">≥ 15%</SelectItem>
                <SelectItem value="20">≥ 20%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Last search info */}
          {settings?.last_search_at && (
            <p className="text-xs text-muted-foreground mb-4">
              Letzte Suche: {format(new Date(settings.last_search_at), 'dd.MM.yyyy HH:mm', { locale: de })}
              {settings.last_search_results_count !== null && (
                <span> • {settings.last_search_results_count} Ergebnisse gefunden</span>
              )}
            </p>
          )}

          {/* Results Table */}
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Keine Ergebnisse</p>
              <p className="text-sm">
                {results?.length === 0 
                  ? 'Starten Sie eine Preissuche, um günstigere Alternativen zu finden.'
                  : 'Keine Ergebnisse entsprechen den aktuellen Filtern.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikel</TableHead>
                    <TableHead className="text-right">Aktueller Preis</TableHead>
                    <TableHead className="text-right">Gefundener Preis</TableHead>
                    <TableHead className="text-right">Ersparnis</TableHead>
                    <TableHead>Lieferant</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result) => (
                    <TableRow key={result.id} className={result.is_dismissed ? 'opacity-50' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{result.article_name}</p>
                          {result.article_category && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {result.article_category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        €{Number(result.current_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        €{Number(result.found_price).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            -{result.savings_percent.toFixed(1)}%
                          </Badge>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            €{result.savings_amount.toFixed(2)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{result.found_supplier}</span>
                          {result.source_url && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={result.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>Quelle öffnen</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!result.is_reviewed && !result.is_dismissed && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={() => markAsReviewed.mutate(result.id)}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Als geprüft markieren</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                      onClick={() => dismissResult.mutate(result.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ignorieren</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          )}
                          {result.is_reviewed && (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              <Check className="w-3 h-3 mr-1" />
                              Geprüft
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kröswang Catalog Search */}
      <Collapsible open={showCatalogSearch} onOpenChange={setShowCatalogSearch}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Kröswang Katalog durchsuchen
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showCatalogSearch ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <KroeswangCatalogSearch />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
