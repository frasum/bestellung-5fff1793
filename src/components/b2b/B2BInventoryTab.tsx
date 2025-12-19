import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useB2BInventorySessionsWithStats,
  useB2BInventorySession,
  useB2BInventoryItems,
  useCreateB2BInventorySession,
  useUpdateB2BInventorySession,
  useBulkUpsertB2BInventoryItems,
  useDeleteB2BInventorySession,
  B2BInventoryItem,
  B2BInventorySessionWithStats,
} from '@/hooks/useB2BInventory';
import { VoiceInventoryCapture, ExtractedArticle } from '@/components/suppliers/VoiceInventoryCapture';
import { VoiceInventoryResults } from '@/components/suppliers/VoiceInventoryResults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  ClipboardList,
  FileText,
  FileSpreadsheet,
  Search,
  Save,
  CheckCircle,
  History,
  Trash2,
  Mic,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface B2BInventoryTabProps {
  accountId: string;
  supplierId?: string;
}

interface LocalInventoryItem {
  article_id: string;
  storage_1: number;
  storage_2: number;
  unit_price?: number;
}

const B2BInventoryTab = ({ accountId, supplierId }: B2BInventoryTabProps) => {
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localItems, setLocalItems] = useState<Map<string, LocalInventoryItem>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [openVendors, setOpenVendors] = useState<Set<string>>(new Set());
  
  // Voice capture state
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceArticles, setVoiceArticles] = useState<ExtractedArticle[]>([]);

  // Fetch B2B vendor articles (filtered by supplierId through vendors)
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['b2b-vendor-articles-for-inventory', accountId, supplierId],
    queryFn: async () => {
      // First get vendors (filtered by supplier_id)
      let vendorsQuery = supabase
        .from('b2b_supplier_vendors')
        .select('id')
        .eq('supplier_account_id', accountId)
        .eq('is_active', true);

      if (supplierId) {
        vendorsQuery = vendorsQuery.eq('supplier_id', supplierId);
      }

      const { data: vendorData } = await vendorsQuery;
      const vendorIds = vendorData?.map(v => v.id) || [];

      if (vendorIds.length === 0) return [];

      const { data, error } = await supabase
        .from('b2b_supplier_vendor_articles')
        .select(`
          *,
          vendor:b2b_supplier_vendors(id, name)
        `)
        .eq('supplier_account_id', accountId)
        .in('vendor_id', vendorIds)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  // Fetch vendors (filtered by supplier_id)
  const { data: vendors } = useQuery({
    queryKey: ['b2b-vendors-for-inventory', accountId, supplierId],
    queryFn: async () => {
      let query = supabase
        .from('b2b_supplier_vendors')
        .select('id, name')
        .eq('supplier_account_id', accountId)
        .eq('is_active', true)
        .order('name');

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
  });

  // Fetch sessions (filtered by supplier_id)
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['b2b-inventory-sessions-filtered', accountId, supplierId],
    queryFn: async () => {
      let query = supabase
        .from('b2b_inventory_sessions')
        .select('*')
        .eq('supplier_account_id', accountId)
        .order('created_at', { ascending: false });

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate stats for each session
      if (!data || data.length === 0) return [];

      const { data: allItems } = await supabase
        .from('b2b_inventory_items')
        .select('session_id, storage_1, storage_2, unit_price')
        .in('session_id', data.map(s => s.id));

      return data.map(session => {
        const sessionItems = allItems?.filter(item => item.session_id === session.id) || [];
        const itemCount = sessionItems.length;
        const totalValue = sessionItems.reduce((sum, item) => {
          const quantity = (Number(item.storage_1) || 0) + (Number(item.storage_2) || 0);
          const price = Number(item.unit_price) || 0;
          return sum + (quantity * price);
        }, 0);

        return { ...session, itemCount, totalValue };
      }) as B2BInventorySessionWithStats[];
    },
    enabled: !!accountId,
  });

  const { data: activeSession } = useB2BInventorySession(activeSessionId);
  const { data: inventoryItems } = useB2BInventoryItems(activeSessionId);

  const createSession = useCreateB2BInventorySession();
  const updateSession = useUpdateB2BInventorySession();
  const bulkUpsertItems = useBulkUpsertB2BInventoryItems();
  const deleteSession = useDeleteB2BInventorySession();

  useEffect(() => {
    if (inventoryItems) {
      const itemsMap = new Map<string, LocalInventoryItem>();
      inventoryItems.forEach((item) => {
        itemsMap.set(item.article_id, {
          article_id: item.article_id,
          storage_1: Number(item.storage_1),
          storage_2: Number(item.storage_2),
          unit_price: item.unit_price != null ? Number(item.unit_price) : undefined,
        });
      });
      setLocalItems(itemsMap);
      setHasChanges(false);
    }
  }, [inventoryItems]);

  useEffect(() => {
    if (sessions && !activeSessionId) {
      const inProgressSession = sessions.find((s) => s.status === 'in_progress');
      if (inProgressSession) {
        setActiveSessionId(inProgressSession.id);
      }
    }
  }, [sessions, activeSessionId]);

  // Extract categories from articles
  const categories = useMemo(() => {
    const allCats = new Set<string>();
    if (articles) {
      articles.filter(a => a.category).forEach(a => allCats.add(a.category!));
    }
    return Array.from(allCats).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    let filtered = articles;

    if (vendorFilter && vendorFilter !== 'all') {
      filtered = filtered.filter((a) => a.vendor_id === vendorFilter);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter((a) => a.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.sku?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [articles, vendorFilter, categoryFilter, searchQuery]);

  const groupedArticles = useMemo(() => {
    if (!filteredArticles) return [];
    
    const grouped = new Map<string, { 
      vendor: { id: string; name: string }; 
      articles: typeof filteredArticles;
      capturedCount: number;
      totalValue: number;
    }>();
    
    filteredArticles.forEach((article) => {
      if (!article.vendor_id || !article.vendor) return;
      
      if (!grouped.has(article.vendor_id)) {
        grouped.set(article.vendor_id, {
          vendor: { id: article.vendor_id, name: article.vendor.name },
          articles: [],
          capturedCount: 0,
          totalValue: 0,
        });
      }
      const group = grouped.get(article.vendor_id)!;
      group.articles.push(article);
      
      const values = localItems.get(article.id);
      if (values && (values.storage_1 > 0 || values.storage_2 > 0)) {
        group.capturedCount++;
        const price = values.unit_price ?? (article.price || 0);
        group.totalValue += (values.storage_1 + values.storage_2) * price;
      }
    });
    
    return Array.from(grouped.values()).sort((a, b) => 
      a.vendor.name.localeCompare(b.vendor.name, 'de')
    );
  }, [filteredArticles, localItems]);

  // Calculate overall stats
  const sessionStats = useMemo(() => {
    let totalArticles = 0;
    let capturedArticles = 0;
    let totalValue = 0;

    groupedArticles.forEach(group => {
      totalArticles += group.articles.length;
      capturedArticles += group.capturedCount;
      totalValue += group.totalValue;
    });

    const progressPercent = totalArticles > 0 ? Math.round((capturedArticles / totalArticles) * 100) : 0;

    return { totalArticles, capturedArticles, totalValue, progressPercent };
  }, [groupedArticles]);

  useEffect(() => {
    if (searchQuery && groupedArticles.length > 0) {
      setOpenVendors(new Set(groupedArticles.map(g => g.vendor.id)));
    }
  }, [searchQuery, groupedArticles]);

  const toggleVendor = (vendorId: string) => {
    setOpenVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    const result = await createSession.mutateAsync({ 
      accountId, 
      name: newSessionName,
      supplierId
    });
    setActiveSessionId(result.id);
    setShowNewSessionDialog(false);
    setNewSessionName('');
  };

  const handleItemChange = (
    articleId: string,
    field: 'storage_1' | 'storage_2',
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setLocalItems((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(articleId) || {
        article_id: articleId,
        storage_1: 0,
        storage_2: 0,
      };
      newMap.set(articleId, { ...existing, [field]: numValue });
      return newMap;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!activeSessionId) return;
    const items = Array.from(localItems.values())
      .filter((item) => item.storage_1 > 0 || item.storage_2 > 0)
      .map((item) => {
        const article = articles?.find((a) => a.id === item.article_id);
        return {
          ...item,
          unit_price: article?.price || 0,
        };
      });
    await bulkUpsertItems.mutateAsync({ session_id: activeSessionId, items });
    setHasChanges(false);
  };

  const handleComplete = async () => {
    if (!activeSessionId) return;
    await handleSave();
    await updateSession.mutateAsync({
      id: activeSessionId,
      accountId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    setActiveSessionId(null);
  };

  const handleLoadSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistoryDialog(false);
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    await deleteSession.mutateAsync({ id: deleteSessionId, accountId });
    if (activeSessionId === deleteSessionId) {
      setActiveSessionId(null);
    }
    setDeleteSessionId(null);
  };

  const handleVoiceResult = (transcript: string, extractedArticles: ExtractedArticle[]) => {
    setVoiceTranscript(transcript);
    setVoiceArticles(extractedArticles);
    
    // Try to match extracted articles with existing vendor articles
    if (articles && extractedArticles.length > 0) {
      extractedArticles.forEach((extracted) => {
        const matchedArticle = articles.find(a => 
          a.name.toLowerCase().includes(extracted.name.toLowerCase()) ||
          extracted.name.toLowerCase().includes(a.name.toLowerCase())
        );
        
        if (matchedArticle && extracted.quantity) {
          setLocalItems((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(matchedArticle.id) || {
              article_id: matchedArticle.id,
              storage_1: 0,
              storage_2: 0,
            };
            newMap.set(matchedArticle.id, { 
              ...existing, 
              storage_1: existing.storage_1 + extracted.quantity! 
            });
            return newMap;
          });
          setHasChanges(true);
        }
      });
      
      toast.success(`${extractedArticles.length} Artikel erkannt`);
    }
    
    setShowVoiceDialog(false);
  };

  const getItemValues = (articleId: string) => {
    const item = localItems.get(articleId);
    return {
      storage_1: item?.storage_1 || 0,
      storage_2: item?.storage_2 || 0,
      total: (item?.storage_1 || 0) + (item?.storage_2 || 0),
    };
  };

  const handleExportExcel = () => {
    if (!filteredArticles || filteredArticles.length === 0) {
      toast.error('Keine Artikel zum Exportieren');
      return;
    }

    const data = filteredArticles.map(article => {
      const values = getItemValues(article.id);
      return {
        'Lieferant': article.vendor?.name || '',
        'Artikel': article.name,
        'SKU': article.sku || '',
        'Kategorie': article.category || '',
        'Lager 1': values.storage_1,
        'Lager 2': values.storage_2,
        'Gesamt': values.total,
        'Preis': article.price || 0,
        'Wert': values.total * (article.price || 0),
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventur');
    XLSX.writeFile(wb, `inventur_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    
    toast.success('Excel exportiert');
  };

  if (articlesLoading || sessionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <div className="flex flex-wrap items-center gap-2 justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Select 
            value={activeSessionId || ''} 
            onValueChange={(value) => setActiveSessionId(value || null)}
          >
            <SelectTrigger className="w-full max-w-xs h-9 bg-background border-border">
              <SelectValue placeholder="Inventur auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {sessions?.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  <div className="flex items-center gap-2">
                    <span>{session.name}</span>
                    <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'} className="text-xs">
                      {session.status === 'in_progress' ? 'Aktiv' : 'Abgeschlossen'}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewSessionDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Neu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryDialog(true)}
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVoiceDialog(true)}
            disabled={!activeSessionId || activeSession?.status === 'completed'}
          >
            <Mic className="h-4 w-4 mr-1" />
            Sprache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            disabled={!activeSessionId}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Active Session Stats */}
      {activeSessionId && activeSession?.status === 'in_progress' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Fortschritt</div>
                  <div className="text-2xl font-bold">{sessionStats.progressPercent}%</div>
                  <div className="text-xs text-muted-foreground">
                    {sessionStats.capturedArticles} / {sessionStats.totalArticles} Artikel
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Gesamtwert</div>
                  <div className="text-2xl font-bold">
                    {sessionStats.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || bulkUpsertItems.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Speichern
                </Button>
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={updateSession.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Abschließen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Alle Lieferanten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Lieferanten</SelectItem>
            {vendors?.map((vendor) => (
              <SelectItem key={vendor.id} value={vendor.id}>
                {vendor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Articles grouped by vendor */}
      {!activeSessionId ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Wählen Sie eine Inventur aus oder starten Sie eine neue.
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowNewSessionDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Inventur starten
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {groupedArticles.map((group) => (
            <Collapsible
              key={group.vendor.id}
              open={openVendors.has(group.vendor.id)}
              onOpenChange={() => toggleVendor(group.vendor.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto py-3 px-4 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {openVendors.has(group.vendor.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{group.vendor.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {group.capturedCount} / {group.articles.length}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {group.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border rounded-lg overflow-hidden mt-1 mb-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Artikel</TableHead>
                        <TableHead className="text-center">Lager 1</TableHead>
                        <TableHead className="text-center">Lager 2</TableHead>
                        <TableHead className="text-center">Gesamt</TableHead>
                        <TableHead className="text-right">Wert</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.articles.map((article) => {
                        const values = getItemValues(article.id);
                        const value = values.total * (article.price || 0);
                        const isDisabled = activeSession?.status === 'completed';
                        
                        return (
                          <TableRow key={article.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{article.name}</div>
                                {article.sku && (
                                  <div className="text-xs text-muted-foreground">{article.sku}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={values.storage_1 || ''}
                                onChange={(e) => handleItemChange(article.id, 'storage_1', e.target.value)}
                                disabled={isDisabled}
                                className="w-20 h-8 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={values.storage_2 || ''}
                                onChange={(e) => handleItemChange(article.id, 'storage_2', e.target.value)}
                                disabled={isDisabled}
                                className="w-20 h-8 text-center mx-auto"
                              />
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {values.total > 0 ? values.total : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {value > 0 
                                ? value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                                : '-'
                              }
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
          
          {groupedArticles.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Keine Artikel gefunden.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* New Session Dialog */}
      <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Inventur starten</DialogTitle>
            <DialogDescription>
              Geben Sie einen Namen für die neue Inventur ein.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session-name">Name</Label>
              <Input
                id="session-name"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder={`Inventur ${format(new Date(), 'dd.MM.yyyy')}`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateSession} disabled={createSession.isPending}>
              Starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inventur-Verlauf</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Artikel</TableHead>
                  <TableHead>Wert</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.name}</TableCell>
                    <TableCell>
                      {format(new Date(session.created_at), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell>{session.itemCount}</TableCell>
                    <TableCell>
                      {session.totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
                        {session.status === 'in_progress' ? 'Aktiv' : 'Abgeschlossen'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadSession(session.id)}
                        >
                          Laden
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteSessionId(session.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Voice Capture Dialog */}
      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Spracherfassung</DialogTitle>
            <DialogDescription>
              Sprechen Sie Ihr Inventar ein, z.B. "Drei Flaschen Rotwein, zwei Kisten Mineralwasser..."
            </DialogDescription>
          </DialogHeader>
          <VoiceInventoryCapture
            language={i18n.language}
            onResult={handleVoiceResult}
            onError={(error) => toast.error(error)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteSessionId} onOpenChange={() => setDeleteSessionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inventur löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Alle erfassten Daten gehen verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default B2BInventoryTab;
