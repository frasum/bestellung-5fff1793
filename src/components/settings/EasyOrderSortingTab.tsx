import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Users, Save, RotateCcw } from 'lucide-react';
import { SortableItem } from './SortableItem';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useArticles } from '@/hooks/useArticles';
import { useSimpleOrderTokens } from '@/hooks/useSimpleOrderTokens';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SupplierOrder {
  id: string;
  supplier_id: string;
  name: string;
  sort_order: number;
}

interface ArticleOrder {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export function EasyOrderSortingTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: suppliers = [] } = useSuppliers();
  const { data: articles = [] } = useArticles();
  const { data: tokens = [] } = useSimpleOrderTokens();

  const [activeTab, setActiveTab] = useState('suppliers');
  const [selectedTokenId, setSelectedTokenId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  
  const [supplierOrder, setSupplierOrder] = useState<SupplierOrder[]>([]);
  const [articleOrder, setArticleOrder] = useState<ArticleOrder[]>([]);
  const [hasSupplierChanges, setHasSupplierChanges] = useState(false);
  const [hasArticleChanges, setHasArticleChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get multi-supplier tokens only
  const multiSupplierTokens = useMemo(() => 
    tokens.filter(t => t.is_multi_supplier && t.token_suppliers && t.token_suppliers.length > 1),
    [tokens]
  );

  // Auto-select first token
  useEffect(() => {
    if (multiSupplierTokens.length > 0 && !selectedTokenId) {
      setSelectedTokenId(multiSupplierTokens[0].id);
    }
  }, [multiSupplierTokens, selectedTokenId]);

  // Auto-select first supplier
  useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0].id);
    }
  }, [suppliers, selectedSupplierId]);

  // Load supplier order for selected token
  useEffect(() => {
    const loadSupplierOrder = async () => {
      if (!selectedTokenId) {
        setSupplierOrder([]);
        return;
      }

      const token = multiSupplierTokens.find(t => t.id === selectedTokenId);
      if (!token?.token_suppliers) return;

      // Fetch current sort_order from database
      const { data } = await supabase
        .from('simple_order_token_suppliers')
        .select('id, supplier_id, sort_order')
        .eq('token_id', selectedTokenId)
        .order('sort_order', { ascending: true });

      if (data) {
        const orderedSuppliers = data.map(item => {
          const supplier = suppliers.find(s => s.id === item.supplier_id);
          return {
            id: item.id,
            supplier_id: item.supplier_id,
            name: supplier?.name || 'Unbekannt',
            sort_order: item.sort_order,
          };
        });
        
        // Sort: by sort_order if set, otherwise alphabetically
        orderedSuppliers.sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.name.localeCompare(b.name, 'de');
        });
        
        setSupplierOrder(orderedSuppliers);
      }
      setHasSupplierChanges(false);
    };

    loadSupplierOrder();
  }, [selectedTokenId, multiSupplierTokens, suppliers]);

  // Load article order for selected supplier
  useEffect(() => {
    if (!selectedSupplierId) {
      setArticleOrder([]);
      return;
    }

    const supplierArticles = articles
      .filter(a => a.supplier_id === selectedSupplierId && a.is_active)
      .map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        sort_order: a.sort_order ?? 0,
      }));

    // Sort: by sort_order if set, otherwise alphabetically
    supplierArticles.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name, 'de');
    });

    setArticleOrder(supplierArticles);
    setHasArticleChanges(false);
  }, [selectedSupplierId, articles]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSupplierDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setSupplierOrder(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    setHasSupplierChanges(true);
  };

  const handleArticleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setArticleOrder(items => {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    setHasArticleChanges(true);
  };

  const saveSupplierOrder = async () => {
    if (!selectedTokenId) return;
    setIsSaving(true);

    try {
      // Update sort_order for each supplier
      for (let i = 0; i < supplierOrder.length; i++) {
        await supabase
          .from('simple_order_token_suppliers')
          .update({ sort_order: i + 1 })
          .eq('id', supplierOrder[i].id);
      }

      toast({
        title: 'Reihenfolge gespeichert',
        description: 'Die Lieferanten-Reihenfolge wurde aktualisiert.',
      });
      setHasSupplierChanges(false);
      queryClient.invalidateQueries({ queryKey: ['simple-order-tokens'] });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Reihenfolge konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveArticleOrder = async () => {
    setIsSaving(true);

    try {
      // Update sort_order for each article
      for (let i = 0; i < articleOrder.length; i++) {
        await supabase
          .from('articles')
          .update({ sort_order: i + 1 })
          .eq('id', articleOrder[i].id);
      }

      toast({
        title: 'Reihenfolge gespeichert',
        description: 'Die Artikel-Reihenfolge wurde aktualisiert.',
      });
      setHasArticleChanges(false);
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Reihenfolge konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetSupplierOrder = () => {
    // Re-sort alphabetically
    setSupplierOrder(prev => 
      [...prev].sort((a, b) => a.name.localeCompare(b.name, 'de'))
    );
    setHasSupplierChanges(true);
  };

  const resetArticleOrder = () => {
    // Re-sort alphabetically
    setArticleOrder(prev => 
      [...prev].sort((a, b) => a.name.localeCompare(b.name, 'de'))
    );
    setHasArticleChanges(true);
  };

  const getTokenLabel = (token: typeof tokens[0]) => {
    if (token.employee?.name) {
      return token.employee.name;
    }
    return token.label;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Reihenfolge anpassen
        </CardTitle>
        <CardDescription>
          Lege die Reihenfolge von Lieferanten und Artikeln für EasyOrder fest
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lieferanten
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Artikel
            </TabsTrigger>
          </TabsList>

          {/* Supplier Sorting Tab */}
          <TabsContent value="suppliers" className="space-y-4 mt-4">
            {multiSupplierTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Multi-Lieferanten QR-Codes vorhanden.</p>
                <p className="text-sm">Erstelle zuerst einen Mitarbeiter mit mehreren Lieferanten.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Select value={selectedTokenId} onValueChange={setSelectedTokenId}>
                      <SelectTrigger>
                        <SelectValue placeholder="QR-Code auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {multiSupplierTokens.map(token => (
                          <SelectItem key={token.id} value={token.id}>
                            {getTokenLabel(token)}
                            <span className="text-muted-foreground ml-2">
                              ({token.token_suppliers?.length} Lieferanten)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetSupplierOrder}
                    disabled={!hasSupplierChanges && supplierOrder.length === 0}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    A-Z
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveSupplierOrder}
                    disabled={!hasSupplierChanges || isSaving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </div>

                {supplierOrder.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSupplierDragEnd}
                  >
                    <SortableContext
                      items={supplierOrder.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {supplierOrder.map((supplier, index) => (
                          <SortableItem key={supplier.id} id={supplier.id}>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="w-8 justify-center">
                                {index + 1}
                              </Badge>
                              <span className="font-medium">{supplier.name}</span>
                            </div>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </>
            )}
          </TabsContent>

          {/* Article Sorting Tab */}
          <TabsContent value="articles" className="space-y-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lieferant auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.filter(s => s.is_active).map(supplier => {
                      const articleCount = articles.filter(a => a.supplier_id === supplier.id && a.is_active).length;
                      return (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                          <span className="text-muted-foreground ml-2">
                            ({articleCount} Artikel)
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetArticleOrder}
                disabled={articleOrder.length === 0}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                A-Z
              </Button>
              <Button
                size="sm"
                onClick={saveArticleOrder}
                disabled={!hasArticleChanges || isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </Button>
            </div>

            {articleOrder.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Artikel für diesen Lieferanten.</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleArticleDragEnd}
              >
                <SortableContext
                  items={articleOrder.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {articleOrder.map((article, index) => (
                      <SortableItem key={article.id} id={article.id}>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="w-8 justify-center shrink-0">
                            {index + 1}
                          </Badge>
                          <div className="min-w-0">
                            <span className="font-medium block truncate">{article.name}</span>
                            {article.description && (
                              <span className="text-sm text-muted-foreground block truncate">
                                {article.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
