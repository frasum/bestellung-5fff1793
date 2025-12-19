import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Minus, Send, ClipboardList, User } from 'lucide-react';
import { useArticles } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LiveDemoEasyOrderPanelProps {
  soundEnabled?: boolean;
}

export function LiveDemoEasyOrderPanel({ soundEnabled }: LiveDemoEasyOrderPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: articles = [] } = useArticles();
  const { data: suppliers = [] } = useSuppliers();
  
  const [employeeName, setEmployeeName] = useState('Demo Mitarbeiter');
  const [search, setSearch] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Create draft for admin approval instead of direct order
  const createDemoDraft = useMutation({
    mutationFn: async (draftData: { supplierId: string; items: { articleId: string; quantity: number }[]; employeeName: string; supplierName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) throw new Error('No organization');

      // Create cart draft
      const { data: draft, error: draftError } = await supabase
        .from('cart_drafts')
        .insert({
          name: `EasyOrder: ${draftData.employeeName} (${draftData.supplierName})`,
          organization_id: profile.organization_id,
          user_id: user.id,
          notes: `EasyOrder Demo - Mitarbeiter: ${draftData.employeeName}`,
        })
        .select()
        .single();

      if (draftError) throw draftError;

      // Create draft items
      const draftItems = draftData.items.map(item => ({
        draft_id: draft.id,
        article_id: item.articleId,
        quantity: item.quantity,
        supplier_id: draftData.supplierId,
      }));

      const { error: itemsError } = await supabase.from('cart_draft_items').insert(draftItems);
      if (itemsError) throw itemsError;

      return draft;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart-drafts'] });
    },
  });

  // Get first active supplier if none selected
  const activeSupplier = useMemo(() => {
    if (selectedSupplierId) {
      return suppliers.find(s => s.id === selectedSupplierId);
    }
    return suppliers.find(s => s.is_active);
  }, [suppliers, selectedSupplierId]);

  // Filter articles by supplier and search
  const filteredArticles = useMemo(() => {
    return articles
      .filter(a => a.is_active && (!activeSupplier || a.supplier_id === activeSupplier.id))
      .filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  }, [articles, activeSupplier, search]);

  const updateQuantity = (articleId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[articleId] || 0;
      const newQty = Math.max(0, current + delta);
      if (newQty === 0) {
        const { [articleId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [articleId]: newQty };
    });
  };

  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  const handleSubmitOrder = async () => {
    if (!activeSupplier || totalItems === 0) return;

    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([articleId, quantity]) => ({
        articleId,
        quantity,
      }));

    try {
      await createDemoDraft.mutateAsync({
        supplierId: activeSupplier.id,
        items: orderItems,
        employeeName,
        supplierName: activeSupplier.name
      });

      if (soundEnabled) {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {});
      }

      toast.success('Vorbestellung gesendet!', {
        description: 'Warte auf Freigabe durch Admin'
      });
      setQuantities({});
    } catch (error) {
      console.error('Draft error:', error);
      toast.error('Fehler beim Senden der Vorbestellung');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-orange-500/5 border-b">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-orange-600" />
          <div>
            <span className="font-semibold text-sm text-orange-700 dark:text-orange-300">EasyOrder</span>
            <p className="text-xs text-muted-foreground">Mitarbeiter-Bestellungen</p>
          </div>
        </div>
        {totalItems > 0 && (
          <Badge className="bg-orange-600 text-white">{totalItems}</Badge>
        )}
      </div>

      {/* Employee Name Input */}
      <div className="p-3 border-b space-y-2">
        <div className="relative">
          <User className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            placeholder="Mitarbeiter-Name"
            className="pl-8 h-8 text-sm"
          />
        </div>
        
        {/* Supplier Selection */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {suppliers.filter(s => s.is_active).slice(0, 4).map(supplier => (
            <Badge
              key={supplier.id}
              variant={activeSupplier?.id === supplier.id ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap text-xs"
              onClick={() => setSelectedSupplierId(supplier.id)}
            >
              {supplier.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Artikel suchen..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* Article List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{activeSupplier ? 'Keine Artikel gefunden' : 'Bitte Lieferant wählen'}</p>
            </div>
          ) : (
            filteredArticles.map(article => {
              const qty = quantities[article.id] || 0;
              return (
                <div 
                  key={article.id} 
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border transition-all",
                    qty > 0 ? "bg-orange-500/5 border-orange-500/30" : "bg-background border-border hover:bg-muted/50"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{article.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {article.unit} • €{article.price.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {qty > 0 && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(article.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {qty > 0 && (
                      <span className="w-5 text-center font-medium text-sm">{qty}</span>
                    )}
                    
                    <Button
                      variant={qty > 0 ? "default" : "ghost"}
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => updateQuantity(article.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Submit Bar */}
      {totalItems > 0 && (
        <div className="p-3 border-t bg-muted/30">
          <Button 
            className="w-full h-8 text-sm gap-2" 
            onClick={handleSubmitOrder}
            disabled={createDemoDraft.isPending}
          >
            <Send className="h-3.5 w-3.5" />
            Vorbestellung senden ({totalItems})
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 border-t text-center">
        <p className="text-xs text-muted-foreground">Mitarbeiter → Admin Freigabe</p>
      </div>
    </div>
  );
}
