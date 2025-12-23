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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  notes: string | null;
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

export const SupplierPortalOwnInventoryTab = ({ session }: Props) => {
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
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
      setCreateDialogOpen(false);
      setNewSessionName('');
      setNewSessionVendor('all');
      
      // Reload and select new session
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
      
      // Mark all as saved
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

    // Save first
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
      setDeleteDialogOpen(false);
      setActiveSession(null);
      setInventoryItems([]);
      setLocalItems({});
      fetchData();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const handleItemChange = (articleId: string, field: 'storage_1' | 'storage_2' | 'unit_price', value: number | null) => {
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
        'Kategorie': article.category || '',
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
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Keine Artikel vorhanden</h3>
          <p className="text-muted-foreground">
            Legen Sie zuerst Artikel an, bevor Sie eine Inventur durchführen können.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {activeSession ? activeSession.name : 'Inventur'}
              </CardTitle>
              {activeSession && (
                <CardDescription>
                  Gestartet am {format(new Date(activeSession.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {!activeSession ? (
                <>
                  <Button variant="accent" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Inventur
                  </Button>
                  {sessions.length > 0 && (
                    <Button variant="outline" onClick={() => setHistoryDialogOpen(true)}>
                      <History className="h-4 w-4 mr-2" />
                      Verlauf
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleExport}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={handleSaveInventory} disabled={saving || !hasChanges}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Speichern
                  </Button>
                  <Button onClick={handleCompleteSession}>
                    <Check className="h-4 w-4 mr-2" />
                    Abschließen
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        {activeSession && (
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span>{sessionStats.counted} von {sessionStats.total} erfasst</span>
                  <span className="font-medium">{sessionStats.totalValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
                </div>
                <Progress value={(sessionStats.counted / sessionStats.total) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Article List */}
      {activeSession && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Alle Lieferanten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Lieferanten</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[60vh]">
              <div className="space-y-3">
                {filteredArticles.map((article) => {
                  const local = localItems[article.id] || { storage_1: 0, storage_2: 0, unit_price: null, changed: false };
                  const total = local.storage_1 + local.storage_2;
                  const vendor = vendors.find(v => v.id === article.vendor_id);

                  return (
                    <Card key={article.id} className={`p-4 ${local.changed ? 'border-primary' : ''}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{article.name}</h3>
                            {article.category && <Badge variant="secondary" className="text-xs">{article.category}</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vendor?.name} {article.sku && `• ${article.sku}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <Label className="text-xs text-muted-foreground">Lager 1</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={local.storage_1}
                              onChange={(e) => handleItemChange(article.id, 'storage_1', parseFloat(e.target.value) || 0)}
                              className="w-20 h-10 text-center text-lg"
                            />
                          </div>
                          <div className="text-center">
                            <Label className="text-xs text-muted-foreground">Lager 2</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={local.storage_2}
                              onChange={(e) => handleItemChange(article.id, 'storage_2', parseFloat(e.target.value) || 0)}
                              className="w-20 h-10 text-center text-lg"
                            />
                          </div>
                          <div className="text-center min-w-[60px]">
                            <Label className="text-xs text-muted-foreground">Gesamt</Label>
                            <div className="h-10 flex items-center justify-center text-lg font-semibold">
                              {total} {article.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Create Session Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Inventur starten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder={`Inventur ${format(new Date(), 'dd.MM.yyyy')}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Lieferant (optional)</Label>
              <Select value={newSessionVendor} onValueChange={setNewSessionVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Lieferanten" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Lieferanten</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateSession}>
              Starten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventur-Verlauf</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {sessions.map((s) => (
                <Card
                  key={s.id}
                  className={`p-3 cursor-pointer hover:bg-muted/50 ${s.status === 'in_progress' ? 'border-primary' : ''}`}
                  onClick={() => { loadSession(s); setHistoryDialogOpen(false); }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(s.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </div>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'secondary' : 'default'}>
                      {s.status === 'completed' ? 'Abgeschlossen' : 'In Bearbeitung'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inventur löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie diese Inventursitzung wirklich löschen? Alle erfassten Daten gehen verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
