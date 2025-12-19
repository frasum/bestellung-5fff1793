import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Save, Loader2, Check, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface B2BMobileInventoryTabProps {
  accountId: string;
  supplierId: string | null;
  token: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface Article {
  id: string;
  name: string;
  price: number | null;
  unit: string | null;
  category: string | null;
  vendor_id: string;
}

interface InventorySession {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface InventoryItem {
  article_id: string;
  storage_1: number;
  storage_2: number;
  unit_price: number | null;
}

const B2BMobileInventoryTab = ({ accountId, supplierId, token }: B2BMobileInventoryTabProps) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSession, setActiveSession] = useState<InventorySession | null>(null);
  const [inventoryItems, setInventoryItems] = useState<Record<string, InventoryItem>>({});
  const [saving, setSaving] = useState(false);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const callEdgeFunction = async (action: string, data?: any) => {
    const { data: response, error } = await supabase.functions.invoke('manage-b2b-mobile-inventory', {
      body: { token, action, data },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Edge function call failed');
    }

    if (response?.error) {
      throw new Error(response.error);
    }

    return response;
  };

  useEffect(() => {
    loadData();
  }, [accountId, supplierId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await callEdgeFunction('load-data');
      
      setVendors(response.vendors || []);
      setArticles(response.articles || []);
      setSessions(response.sessions || []);

      // Auto-select in-progress session
      const inProgressSession = response.sessions?.find((s: InventorySession) => s.status === 'in_progress');
      if (inProgressSession) {
        setActiveSession(inProgressSession);
        await loadSessionItems(inProgressSession.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSessionItems = async (sessionId: string) => {
    try {
      const response = await callEdgeFunction('load-session-items', { sessionId });
      
      if (response.items) {
        const itemsMap: Record<string, InventoryItem> = {};
        response.items.forEach((item: InventoryItem) => {
          itemsMap[item.article_id] = item;
        });
        setInventoryItems(itemsMap);
      }
    } catch (error) {
      console.error('Error loading session items:', error);
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesVendor = selectedVendor === 'all' || article.vendor_id === selectedVendor;
      const matchesSearch = !searchTerm ||
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.category && article.category.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesVendor && matchesSearch;
    });
  }, [articles, selectedVendor, searchTerm]);

  const createSession = async () => {
    if (!newSessionName.trim()) {
      toast({
        title: 'Name erforderlich',
        description: 'Bitte geben Sie einen Namen für die Inventur ein',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await callEdgeFunction('create-session', { name: newSessionName.trim() });

      setSessions(prev => [response.session, ...prev]);
      setActiveSession(response.session);
      setInventoryItems({});
      setShowNewSessionDialog(false);
      setNewSessionName('');
      
      toast({
        title: 'Inventur erstellt',
        description: 'Sie können jetzt Bestände erfassen',
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Fehler',
        description: 'Inventur konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };

  const updateInventoryItem = (articleId: string, field: 'storage_1' | 'storage_2', value: string) => {
    const numValue = parseFloat(value) || 0;
    setInventoryItems(prev => ({
      ...prev,
      [articleId]: {
        ...prev[articleId],
        article_id: articleId,
        storage_1: field === 'storage_1' ? numValue : (prev[articleId]?.storage_1 || 0),
        storage_2: field === 'storage_2' ? numValue : (prev[articleId]?.storage_2 || 0),
        unit_price: prev[articleId]?.unit_price || articles.find(a => a.id === articleId)?.price || null,
      },
    }));
  };

  const saveInventory = async () => {
    if (!activeSession) return;

    setSaving(true);
    try {
      // Get items that have values
      const itemsToSave = Object.entries(inventoryItems)
        .filter(([_, item]) => item.storage_1 > 0 || item.storage_2 > 0)
        .map(([articleId, item]) => ({
          article_id: articleId,
          storage_1: item.storage_1,
          storage_2: item.storage_2,
          unit_price: item.unit_price,
        }));

      const response = await callEdgeFunction('save-inventory', { 
        sessionId: activeSession.id, 
        items: itemsToSave 
      });

      toast({
        title: 'Gespeichert',
        description: `${response.itemCount} Positionen gespeichert`,
      });
    } catch (error) {
      console.error('Error saving inventory:', error);
      toast({
        title: 'Fehler',
        description: 'Inventur konnte nicht gespeichert werden',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const completeSession = async () => {
    if (!activeSession) return;

    await saveInventory();

    try {
      await callEdgeFunction('complete-session', { sessionId: activeSession.id });

      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id ? { ...s, status: 'completed' } : s
        )
      );
      setActiveSession(null);
      setInventoryItems({});

      toast({
        title: 'Inventur abgeschlossen',
        description: 'Die Inventur wurde erfolgreich abgeschlossen',
      });
    } catch (error) {
      console.error('Error completing session:', error);
      toast({
        title: 'Fehler',
        description: 'Inventur konnte nicht abgeschlossen werden',
        variant: 'destructive',
      });
    }
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || 'Unbekannt';
  };

  const itemsWithValues = useMemo(() => {
    return Object.values(inventoryItems).filter(item => item.storage_1 > 0 || item.storage_2 > 0).length;
  }, [inventoryItems]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-4">
      {/* Session Header */}
      <div className="p-4 bg-card border-b space-y-3">
        {activeSession ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{activeSession.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(activeSession.created_at), 'PPp', { locale: de })}
              </p>
            </div>
            <Badge>{itemsWithValues} Positionen</Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">Keine aktive Inventur</p>
            <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Inventur
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Inventur starten</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Name der Inventur"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={createSession}>
                    Starten
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {activeSession && (
          <>
            <Select value={selectedVendor} onValueChange={setSelectedVendor}>
              <SelectTrigger>
                <SelectValue placeholder="Lieferant filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Lieferanten</SelectItem>
                {vendors.map(vendor => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Artikel suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </>
        )}
      </div>

      {/* Article List */}
      {activeSession ? (
        <>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Artikel gefunden
                </div>
              ) : (
                filteredArticles.map(article => {
                  const item = inventoryItems[article.id];
                  const hasValue = item && (item.storage_1 > 0 || item.storage_2 > 0);
                  return (
                    <Card key={article.id} className={`p-3 ${hasValue ? 'border-primary' : ''}`}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{article.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {getVendorName(article.vendor_id)}
                              {article.unit && ` · ${article.unit}`}
                            </p>
                          </div>
                          {hasValue && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Lager 1</label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={item?.storage_1 || ''}
                              onChange={(e) => updateInventoryItem(article.id, 'storage_1', e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Lager 2</label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="0"
                              value={item?.storage_2 || ''}
                              onChange={(e) => updateInventoryItem(article.id, 'storage_2', e.target.value)}
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="p-4 border-t bg-card space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={saveInventory}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Speichern
              </Button>
              <Button onClick={completeSession} disabled={saving}>
                <Check className="h-4 w-4 mr-2" />
                Abschließen
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 p-4">
          <h3 className="font-medium mb-3">Vergangene Inventuren</h3>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Noch keine Inventuren vorhanden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(session => (
                <Card
                  key={session.id}
                  className="p-3 cursor-pointer hover:bg-accent"
                  onClick={() => {
                    if (session.status === 'in_progress') {
                      setActiveSession(session);
                      loadSessionItems(session.id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{session.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.created_at), 'PPp', { locale: de })}
                      </p>
                    </div>
                    <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
                      {session.status === 'in_progress' ? 'In Arbeit' : 'Abgeschlossen'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default B2BMobileInventoryTab;
