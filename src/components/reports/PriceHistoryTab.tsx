import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAllPriceHistory } from '@/hooks/usePriceHistory';
import { useSuppliers } from '@/hooks/useSuppliers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Download, TrendingUp, TrendingDown, Minus, Search, Loader2, FileText, ShoppingCart, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimeRangeFilter = '7d' | '30d' | '90d' | 'all';
type SourceFilter = 'all' | 'manual' | 'invoice' | 'supplier_portal' | 'csv_import';

export const PriceHistoryTab = () => {
  const { t, i18n } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('30d');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: priceHistory, isLoading } = useAllPriceHistory();
  const { data: suppliers } = useSuppliers();

  // Filter data
  const filteredData = useMemo(() => {
    if (!priceHistory) return [];

    let filtered = [...priceHistory];

    // Time range filter
    if (timeRange !== 'all') {
      const now = new Date();
      const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
      const daysAgo = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => new Date(item.changed_at) >= daysAgo);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(item => item.change_source === sourceFilter);
    }

    // Supplier filter
    if (supplierFilter !== 'all') {
      filtered = filtered.filter(item => item.articles?.supplier_id === supplierFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.articles?.name?.toLowerCase().includes(query) ||
        item.articles?.sku?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [priceHistory, timeRange, sourceFilter, supplierFilter, searchQuery]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!filteredData.length) return { total: 0, increases: 0, decreases: 0, avgIncreasePercent: 0, avgDecreasePercent: 0 };

    const increases = filteredData.filter(item => item.new_price > item.old_price);
    const decreases = filteredData.filter(item => item.new_price < item.old_price);

    const avgIncreasePercent = increases.length > 0
      ? increases.reduce((sum, item) => sum + ((item.new_price - item.old_price) / item.old_price * 100), 0) / increases.length
      : 0;

    const avgDecreasePercent = decreases.length > 0
      ? decreases.reduce((sum, item) => sum + ((item.old_price - item.new_price) / item.old_price * 100), 0) / decreases.length
      : 0;

    return {
      total: filteredData.length,
      increases: increases.length,
      decreases: decreases.length,
      avgIncreasePercent,
      avgDecreasePercent
    };
  }, [filteredData]);

  // Format change percentage
  const formatChange = (oldPrice: number, newPrice: number) => {
    const diff = newPrice - oldPrice;
    const percent = oldPrice > 0 ? (diff / oldPrice) * 100 : 0;
    return { diff, percent };
  };

  // Get source label
  const getSourceLabel = (source: string, invoiceNumber?: string, orderNumber?: string) => {
    if (source === 'invoice' && invoiceNumber) {
      return { label: `Rechnung ${invoiceNumber}`, icon: FileText, href: '#' };
    }
    if (source === 'order' && orderNumber) {
      return { label: `Bestellung ${orderNumber}`, icon: ShoppingCart, href: '#' };
    }
    const sourceLabels: Record<string, string> = {
      manual: 'Manuell',
      invoice: 'Rechnung',
      supplier_portal: 'Lieferantenportal',
      csv_import: 'CSV-Import',
      order: 'Bestellung'
    };
    return { label: sourceLabels[source] || source, icon: ArrowUpDown, href: null };
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredData.length) return;

    const headers = ['Datum', 'Artikel', 'SKU', 'Lieferant', 'Alter Preis', 'Neuer Preis', 'Änderung €', 'Änderung %', 'Quelle'];
    const rows = filteredData.map(item => {
      const { diff, percent } = formatChange(item.old_price, item.new_price);
      return [
        format(new Date(item.changed_at), 'dd.MM.yyyy HH:mm'),
        item.articles?.name || '',
        item.articles?.sku || '',
        item.articles?.suppliers?.name || '',
        item.old_price.toFixed(2),
        item.new_price.toFixed(2),
        diff.toFixed(2),
        percent.toFixed(1),
        getSourceLabel(item.change_source, item.invoices?.invoice_number, item.orders?.order_number).label
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `preishistorie-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preisänderungen</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preiserhöhungen</p>
                <p className="text-2xl font-semibold text-destructive">{stats.increases}</p>
                {stats.increases > 0 && (
                  <p className="text-xs text-muted-foreground">Ø +{stats.avgIncreasePercent.toFixed(1)}%</p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Preissenkungen</p>
                <p className="text-2xl font-semibold text-success">{stats.decreases}</p>
                {stats.decreases > 0 && (
                  <p className="text-xs text-muted-foreground">Ø -{stats.avgDecreasePercent.toFixed(1)}%</p>
                )}
              </div>
              <TrendingDown className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRangeFilter)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                <SelectItem value="90d">Letzte 3 Monate</SelectItem>
                <SelectItem value="all">Alle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Quellen</SelectItem>
                <SelectItem value="manual">Manuell</SelectItem>
                <SelectItem value="invoice">Rechnung</SelectItem>
                <SelectItem value="supplier_portal">Lieferantenportal</SelectItem>
                <SelectItem value="csv_import">CSV-Import</SelectItem>
              </SelectContent>
            </Select>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Lieferant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Lieferanten</SelectItem>
                {suppliers?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} disabled={!filteredData.length}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ArrowUpDown className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Keine Preisänderungen gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Artikel</TableHead>
                    <TableHead>Lieferant</TableHead>
                    <TableHead className="text-right">Alter Preis</TableHead>
                    <TableHead className="text-right">Neuer Preis</TableHead>
                    <TableHead className="text-right">Änderung</TableHead>
                    <TableHead>Quelle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(item => {
                    const { diff, percent } = formatChange(item.old_price, item.new_price);
                    const isIncrease = diff > 0;
                    const isDecrease = diff < 0;
                    const source = getSourceLabel(item.change_source, item.invoices?.invoice_number, item.orders?.order_number);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(item.changed_at), 'dd.MM.yy HH:mm', { locale: de })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.articles?.name || 'Unbekannt'}</span>
                            {item.articles?.sku && (
                              <span className="text-xs text-muted-foreground ml-2">({item.articles.sku})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.articles?.suppliers?.name || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          €{item.old_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          €{item.new_price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={cn(
                            "flex items-center justify-end gap-1 font-medium",
                            isIncrease && "text-destructive",
                            isDecrease && "text-success"
                          )}>
                            {isIncrease && <TrendingUp className="w-3 h-3" />}
                            {isDecrease && <TrendingDown className="w-3 h-3" />}
                            {!isIncrease && !isDecrease && <Minus className="w-3 h-3" />}
                            <span>
                              {isIncrease ? '+' : ''}{diff.toFixed(2)}€ ({isIncrease ? '+' : ''}{percent.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            <source.icon className="w-3 h-3 mr-1" />
                            {source.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-2">
            {filteredData.map(item => {
              const { diff, percent } = formatChange(item.old_price, item.new_price);
              const isIncrease = diff > 0;
              const isDecrease = diff < 0;
              const source = getSourceLabel(item.change_source, item.invoices?.invoice_number, item.orders?.order_number);
              
              return (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{item.articles?.name || 'Unbekannt'}</p>
                        <p className="text-xs text-muted-foreground">{item.articles?.suppliers?.name || '-'}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">
                        {source.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {format(new Date(item.changed_at), 'dd.MM.yy', { locale: de })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">€{item.old_price.toFixed(2)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-mono font-medium">€{item.new_price.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "text-right text-sm font-medium mt-1",
                      isIncrease && "text-destructive",
                      isDecrease && "text-success"
                    )}>
                      {isIncrease ? '+' : ''}{diff.toFixed(2)}€ ({isIncrease ? '+' : ''}{percent.toFixed(1)}%)
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
