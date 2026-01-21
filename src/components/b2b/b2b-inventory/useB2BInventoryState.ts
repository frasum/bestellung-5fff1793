import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useB2BInventorySession,
  useB2BInventoryItems,
  useCreateB2BInventorySession,
  useUpdateB2BInventorySession,
  useBulkUpsertB2BInventoryItems,
  useDeleteB2BInventorySession,
  B2BInventorySessionWithStats,
} from '@/hooks/useB2BInventory';
import { ExtractedArticle } from '@/components/suppliers/VoiceInventoryCapture';
import { toast } from 'sonner';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { LocalInventoryItem, VendorArticle, Vendor, VendorGroup, SessionStats } from './types';

interface UseB2BInventoryStateProps {
  accountId: string;
  supplierId?: string;
}

export function useB2BInventoryState({ accountId, supplierId }: UseB2BInventoryStateProps) {
  const { t, i18n } = useTranslation();

  // Dialog states
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState('');

  // Filter states
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Local inventory state
  const [localItems, setLocalItems] = useState<Map<string, LocalInventoryItem>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const [openVendors, setOpenVendors] = useState<Set<string>>(new Set());

  // Voice capture state
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [voiceArticles, setVoiceArticles] = useState<ExtractedArticle[]>([]);

  // Fetch B2B vendor articles
  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['b2b-vendor-articles-for-inventory', accountId, supplierId],
    queryFn: async () => {
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
      return data as VendorArticle[];
    },
    enabled: !!accountId,
  });

  // Fetch vendors
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
      return data as Vendor[];
    },
    enabled: !!accountId,
  });

  // Fetch sessions
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

  // Sync local items with fetched inventory items
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

  // Auto-select in-progress session
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

  // Filter articles
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

  // Group articles by vendor
  const groupedArticles = useMemo((): VendorGroup[] => {
    if (!filteredArticles) return [];

    const grouped = new Map<string, VendorGroup>();

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
  const sessionStats = useMemo((): SessionStats => {
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

  // Expand vendors when searching
  useEffect(() => {
    if (searchQuery && groupedArticles.length > 0) {
      setOpenVendors(new Set(groupedArticles.map(g => g.vendor.id)));
    }
  }, [searchQuery, groupedArticles]);

  const toggleVendor = useCallback((vendorId: string) => {
    setOpenVendors((prev) => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  }, []);

  const handleCreateSession = useCallback(async () => {
    if (!newSessionName.trim()) return;
    const result = await createSession.mutateAsync({
      accountId,
      name: newSessionName,
      supplierId
    });
    setActiveSessionId(result.id);
    setShowNewSessionDialog(false);
    setNewSessionName('');
  }, [newSessionName, accountId, supplierId, createSession]);

  const handleItemChange = useCallback((
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
  }, []);

  const handleSave = useCallback(async () => {
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
  }, [activeSessionId, localItems, articles, bulkUpsertItems]);

  const handleComplete = useCallback(async () => {
    if (!activeSessionId) return;
    await handleSave();
    await updateSession.mutateAsync({
      id: activeSessionId,
      accountId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    setActiveSessionId(null);
  }, [activeSessionId, accountId, handleSave, updateSession]);

  const handleLoadSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setShowHistoryDialog(false);
  }, []);

  const handleDeleteSession = useCallback(async () => {
    if (!deleteSessionId) return;
    await deleteSession.mutateAsync({ id: deleteSessionId, accountId });
    if (activeSessionId === deleteSessionId) {
      setActiveSessionId(null);
    }
    setDeleteSessionId(null);
  }, [deleteSessionId, accountId, activeSessionId, deleteSession]);

  const handleVoiceResult = useCallback((transcript: string, extractedArticles: ExtractedArticle[]) => {
    setVoiceTranscript(transcript);
    setVoiceArticles(extractedArticles);

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
  }, [articles]);

  const getItemValues = useCallback((articleId: string) => {
    const item = localItems.get(articleId);
    return {
      storage_1: item?.storage_1 || 0,
      storage_2: item?.storage_2 || 0,
      total: (item?.storage_1 || 0) + (item?.storage_2 || 0),
    };
  }, [localItems]);

  const handleExportExcel = useCallback(() => {
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
  }, [filteredArticles, getItemValues]);

  return {
    // Translation
    i18n,

    // Loading states
    isLoading: articlesLoading || sessionsLoading,

    // Data
    articles,
    vendors,
    sessions,
    activeSession,
    categories,
    filteredArticles,
    groupedArticles,
    sessionStats,

    // Session state
    activeSessionId,
    setActiveSessionId,

    // Dialog states
    showNewSessionDialog,
    setShowNewSessionDialog,
    showHistoryDialog,
    setShowHistoryDialog,
    showVoiceDialog,
    setShowVoiceDialog,
    deleteSessionId,
    setDeleteSessionId,
    newSessionName,
    setNewSessionName,

    // Filter states
    vendorFilter,
    setVendorFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,

    // Vendor collapse state
    openVendors,
    toggleVendor,

    // Changes state
    hasChanges,

    // Mutation loading
    createSessionPending: createSession.isPending,
    updateSessionPending: updateSession.isPending,
    bulkUpsertPending: bulkUpsertItems.isPending,

    // Handlers
    handleCreateSession,
    handleItemChange,
    handleSave,
    handleComplete,
    handleLoadSession,
    handleDeleteSession,
    handleVoiceResult,
    getItemValues,
    handleExportExcel,
  };
}
