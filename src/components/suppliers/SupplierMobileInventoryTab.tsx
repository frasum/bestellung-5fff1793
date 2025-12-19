import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Search, ClipboardList, Check, History, Trash2, FileDown, Save, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
}

interface OwnVendor {
  id: string;
  name: string;
}

interface OwnArticle {
  id: string;
  vendor_id: string;
  name: string;
  sku: string | null;
  price: number;
  unit: string;
  category: string | null;
}

interface InventorySession {
  id: string;
  name: string;
  status: string;
  vendor_id: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

interface InventoryItem {
  id: string;
  article_id: string;
  storage_1: number;
  storage_2: number;
  total: number;
  unit_price: number | null;
}

interface LocalInventoryItem {
  storage_1: number;
  storage_2: number;
  unit_price: number | null;
  changed: boolean;
}

interface Props {
  session: SupplierSession;
}

export const SupplierMobileInventoryTab = ({ session }: Props) => {
  const [articles, setArticles] = useState<OwnArticle[]>([]);
  const [vendors, setVendors] = useState<OwnVendor[]>([]);
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [activeSession, setActiveSession] = useState<InventorySession | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [localItems, setLocalItems] = useState<Record<string, LocalInventoryItem>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionVendor, setNewSessionVendor] = useState<string>('all');

  const fetchData = async () => {
    try {
      const [articlesRes, vendorsRes, sessionsRes] = await Promise.all([
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-articles',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-vendors',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-inventory-sessions',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (vendorsRes.error) throw vendorsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;
      
      setArticles(articlesRes.data?.articles || []);
      setVendors(vendorsRes.data?.vendors || []);
      setSessions(sessionsRes.data?.sessions || []);

      // Auto-select in-progress session
      const inProgress = (sessionsRes.data?.sessions || []).find((s: InventorySession) => s.status === 'in_progress');
      if (inProgress) {
        await loadSession(inProgress);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const loadSession = async (inventorySession: InventorySession) => {
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'get-own-inventory-session',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          sessionId: inventorySession.id,
        },
      });

      if (error) throw error;
      
      setActiveSession(inventorySession);
      setInventoryItems(data?.items || []);
      
      // Initialize local items
      const local: Record<string, LocalInventoryItem> = {};
      (data?.items || []).forEach((item: InventoryItem) => {
        local[item.article_id] = {
          storage_1: item.storage_1,
          storage_2: item.storage_2,
          unit_price: item.unit_price,
          changed: false,
        };
      });
      setLocalItems(local);
      
      // Set vendor filter based on session
      if (inventorySession.vendor_id) {
        setVendorFilter(inventorySession.vendor_id);
      }
    } catch (error: any) {
      console.error('Error loading session:', error);
      toast.error('Fehler beim Laden der Sitzung');
    }
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'create-own-inventory-session',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          sessionData: {
            name: newSessionName.trim(),
            vendor_id: newSessionVendor === 'all' ? null : newSessionVendor,
          },
        },
      });

      if (error) throw error;
      
      toast.success('Inventursitzung erstellt');
      setCreateSheetOpen(false);
      setNewSessionName('');
      setNewSessionVendor('all');
      
      await fetchData();
      if (data?.session) {
        await loadSession(data.session);
      }
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast.error('Fehler beim Erstellen');
    }
  };

  const handleSaveInventory = async () => {
    if (!activeSession) return;

    const changedItems = Object.entries(localItems)
      .filter(([_, item]) => item.changed)
      .map(([articleId, item]) => ({
        article_id: articleId,
        storage_1: item.storage_1,
        storage_2: item.storage_2,
        unit_price: item.unit_price,
      }));

    if (changedItems.length === 0) {
      toast.info('Keine Änderungen zum Speichern');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'save-own-inventory-items',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          sessionId: activeSession.id,
          items: changedItems,
        },
      });

      if (error) throw error;
      
      setLocalItems(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = { ...updated[key], changed: false };
        });
        return updated;
      });
      
      toast.success(`${changedItems.length} Artikel gespeichert`);
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    await handleSaveInventory();

    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'complete-own-inventory-session',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          sessionId: activeSession.id,
        },
      });

      if (error) throw error;
      
      toast.success('Inventur abgeschlossen');
      setActiveSession(null);
      setInventoryItems([]);
      setLocalItems({});
      fetchData();
    } catch (error: any) {
      console.error('Error completing session:', error);
      toast.error('Fehler beim Abschließen');
    }
  };

  const handleDeleteSession = async () => {
    if (!activeSession) return;

    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'delete-own-inventory-session',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          sessionId: activeSession.id,
        },
      });

      if (error) throw error;
      
      toast.success('Inventur gelöscht');
      setActiveSession(null);
      setInventoryItems([]);
      setLocalItems({});
      fetchData();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const handleItemChange = (articleId: string, field: 'storage_1' | 'storage_2', value: number) => {
    setLocalItems(prev => ({
      ...prev,
      [articleId]: {
        storage_1: prev[articleId]?.storage_1 || 0,
        storage_2: prev[articleId]?.storage_2 || 0,
        unit_price: prev[articleId]?.unit_price || null,
        ...prev[articleId],
        [field]: value,
        changed: true,
      },
    }));
  };

  const handleExport = () => {
    const filteredForExport = filteredArticles.map(article => {
      const local = localItems[article.id];
      const vendor = vendors.find(v => v.id === article.vendor_id);
      return {
        'Lieferant': vendor?.name || '',
        'Artikel': article.name,
        'SKU': article.sku || '',
        'Lager 1': local?.storage_1 || 0,
        'Lager 2': local?.storage_2 || 0,
        'Gesamt': (local?.storage_1 || 0) + (local?.storage_2 || 0),
        'Einheit': article.unit,
        'Stückpreis': local?.unit_price || article.price,
        'Wert': ((local?.storage_1 || 0) + (local?.storage_2 || 0)) * (local?.unit_price || article.price),
      };
    });

    const ws = XLSX.utils.json_to_sheet(filteredForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventur');
    XLSX.writeFile(wb, `Inventur_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success('Excel exportiert');
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVendor = vendorFilter === 'all' || a.vendor_id === vendorFilter;
      return matchesSearch && matchesVendor;
    });
  }, [articles, searchTerm, vendorFilter]);

  const sessionStats = useMemo(() => {
    const total = filteredArticles.length;
    const counted = filteredArticles.filter(a => {
      const local = localItems[a.id];
      return local && (local.storage_1 > 0 || local.storage_2 > 0);
    }).length;
    const totalValue = filteredArticles.reduce((sum, a) => {
      const local = localItems[a.id];
      const qty = (local?.storage_1 || 0) + (local?.storage_2 || 0);
      const price = local?.unit_price || a.price;
      return sum + qty * price;
    }, 0);
    return { total, counted, totalValue };
  }, [filteredArticles, localItems]);

  const hasChanges = Object.values(localItems).some(item => item.changed);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">Keine Artikel vorhanden</h3>
            <p className="text-muted-foreground text-sm">
              Legen Sie zuerst Artikel im Supplier Portal an.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No active session - show start screen
  if (!activeSession) {
    return (
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Inventur
            </CardTitle>
            <CardDescription>
              Starten Sie eine neue Inventursitzung oder setzen Sie eine vorherige fort.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full h-14 text-base" onClick={() => setCreateSheetOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Neue Inventur starten
            </Button>
            
            {sessions.filter(s => s.status === 'in_progress').length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Laufende Inventuren:</p>
                {sessions.filter(s => s.status === 'in_progress').map(s => (
                  <Button
                    key={s.id}
                    variant="outline"
                    className="w-full justify-start h-12"
                    onClick={() => loadSession(s)}
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    {s.name}
                  </Button>
                ))}
              </div>
            )}
            
            {sessions.filter(s => s.status === 'completed').length > 0 && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setHistorySheetOpen(true)}
              >
                <History className="h-4 w-4 mr-2" />
                Verlauf anzeigen ({sessions.filter(s => s.status === 'completed').length})
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Create Session Sheet */}
        <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
          <SheetContent side="bottom" className="h-auto">
            <SheetHeader>
              <SheetTitle>Neue Inventur</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="z.B. Monatsende Dezember"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Lieferant (optional)</Label>
                <Select value={newSessionVendor} onValueChange={setNewSessionVendor}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Alle Lieferanten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Lieferanten</SelectItem>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full h-12" onClick={handleCreateSession}>
                Inventur starten
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* History Sheet */}
        <Sheet open={historySheetOpen} onOpenChange={setHistorySheetOpen}>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>Inventur-Verlauf</SheetTitle>
            </SheetHeader>
            <ScrollArea className="flex-1 -mx-6 px-6 mt-4" style={{ height: 'calc(70vh - 100px)' }}>
              <div className="space-y-3">
                {sessions.filter(s => s.status === 'completed').map(s => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(s.completed_at || s.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </p>
                        </div>
                        <Badge variant="outline">Abgeschlossen</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Active session - show inventory form
  return (
    <div className="flex flex-col h-full">
      {/* Session Info */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold">{activeSession.name}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(activeSession.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
            </p>
          </div>
          <Badge>{sessionStats.counted}/{sessionStats.total}</Badge>
        </div>
        <Progress value={(sessionStats.counted / sessionStats.total) * 100} className="h-2" />
        <p className="text-sm text-right mt-1 text-muted-foreground">
          Wert: {sessionStats.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
        </p>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Artikel suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Alle Lieferanten" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Lieferanten</SelectItem>
            {vendors.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Article List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredArticles.map(article => {
            const local = localItems[article.id];
            const vendor = vendors.find(v => v.id === article.vendor_id);
            const total = (local?.storage_1 || 0) + (local?.storage_2 || 0);
            
            return (
              <Card key={article.id} className={local?.changed ? 'ring-2 ring-primary' : ''}>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h4 className="font-medium">{article.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {vendor?.name} · {article.unit}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Lager 1</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={local?.storage_1 || ''}
                        onChange={(e) => handleItemChange(article.id, 'storage_1', parseFloat(e.target.value) || 0)}
                        className="h-12 text-center text-lg"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Lager 2</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={local?.storage_2 || ''}
                        onChange={(e) => handleItemChange(article.id, 'storage_2', parseFloat(e.target.value) || 0)}
                        className="h-12 text-center text-lg"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Gesamt</Label>
                      <div className="h-12 flex items-center justify-center bg-muted rounded-md text-lg font-medium">
                        {total}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 border-t bg-background p-4 space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-12" onClick={handleExport}>
            <FileDown className="h-5 w-5 mr-2" />
            Excel
          </Button>
          <Button variant="outline" className="flex-1 h-12" onClick={handleSaveInventory} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            Speichern
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-12" onClick={handleDeleteSession}>
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
          <Button className="flex-1 h-12" onClick={handleCompleteSession}>
            <Check className="h-5 w-5 mr-2" />
            Abschließen
          </Button>
        </div>
      </div>
    </div>
  );
};
