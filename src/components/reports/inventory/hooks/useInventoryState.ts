import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useArticles, Article } from '@/hooks/useArticles';
import { useSuppliers } from '@/hooks/useSuppliers';
import {
  useInventorySessionsWithStats,
  useInventorySession,
  useInventoryItems,
  useCreateInventorySession,
  useUpdateInventorySession,
  useBulkUpsertInventoryItems,
  useDeleteInventorySession,
  useUpsertInventoryItem,
} from '@/hooks/useInventory';
import { useUnits } from '@/hooks/useUnits';
import { useLocationContext } from '@/contexts/LocationContext';
import { useCategories } from '@/hooks/useCategories';
import { LocalInventoryItem, SupplierGroup, SessionStats, DEFAULT_UNITS } from '../types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function useInventoryState() {
  const { t } = useTranslation();
  const { activeLocation } = useLocationContext();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [localItems, setLocalItems] = useState<Map<string, LocalInventoryItem>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-save tracking
  const [savingArticleIds, setSavingArticleIds] = useState<Set<string>>(new Set());
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
  const saveTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { data: suppliers } = useSuppliers();
  const { data: sessions, isLoading: sessionsLoading } = useInventorySessionsWithStats();
  const { data: activeSession } = useInventorySession(activeSessionId);
  const { data: inventoryItems } = useInventoryItems(activeSessionId);
  const { data: units } = useUnits();
  const { data: dbCategories } = useCategories();

  const createSession = useCreateInventorySession();
  const updateSession = useUpdateInventorySession();
  const bulkUpsertItems = useBulkUpsertInventoryItems();
  const deleteSession = useDeleteInventorySession();
  const upsertItem = useUpsertInventoryItem();

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      saveTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Reset active session when location changes
  useEffect(() => {
    setActiveSessionId(null);
  }, [activeLocation?.id]);

  const commonUnits = useMemo(() => {
    const dbUnits = units?.map(u => u.name) || [];
    const articleUnits = articles?.map(a => a.unit).filter(Boolean) || [];
    const allUnits = [...new Set([...dbUnits, ...articleUnits])];
    return allUnits.length > 0 ? allUnits.sort() : DEFAULT_UNITS;
  }, [units, articles]);

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

  const categories = useMemo(() => {
    const allCats = new Set<string>();
    if (dbCategories) {
      dbCategories.forEach(c => allCats.add(c.name));
    }
    if (articles) {
      articles.filter(a => a.category).forEach(a => allCats.add(a.category!));
    }
    return Array.from(allCats).sort();
  }, [articles, dbCategories]);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    let filtered = articles.filter((a) => a.is_active);

    if (supplierFilter && supplierFilter !== 'all') {
      filtered = filtered.filter((a) => a.supplier_id === supplierFilter);
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

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [articles, supplierFilter, categoryFilter, searchQuery]);

  const groupedArticlesBySupplier = useMemo((): SupplierGroup[] => {
    if (!filteredArticles) return [];
    
    const grouped = new Map<string, SupplierGroup>();
    
    filteredArticles.forEach((article) => {
      if (!article.supplier_id || !article.suppliers) return;
      
      if (!grouped.has(article.supplier_id)) {
        grouped.set(article.supplier_id, {
          supplier: { id: article.supplier_id, name: article.suppliers.name },
          articles: [],
          capturedCount: 0,
          totalValue: 0,
        });
      }
      grouped.get(article.supplier_id)!.articles.push(article);
    });
    
    return Array.from(grouped.values()).sort((a, b) => 
      a.supplier.name.localeCompare(b.supplier.name, 'de')
    );
  }, [filteredArticles]);

  const groupedInventoryArticles = useMemo((): SupplierGroup[] => {
    if (!filteredArticles) return [];
    
    const grouped = new Map<string, SupplierGroup>();
    
    filteredArticles.forEach((article) => {
      if (!article.supplier_id || !article.suppliers) return;
      
      if (!grouped.has(article.supplier_id)) {
        grouped.set(article.supplier_id, {
          supplier: { id: article.supplier_id, name: article.suppliers.name },
          articles: [],
          capturedCount: 0,
          totalValue: 0,
        });
      }
      const group = grouped.get(article.supplier_id)!;
      group.articles.push(article);
      
      const values = localItems.get(article.id);
      if (values && (values.storage_1 > 0 || values.storage_2 > 0)) {
        group.capturedCount++;
        const price = values.unit_price ?? article.price;
        group.totalValue += (values.storage_1 + values.storage_2) * price;
      }
    });
    
    return Array.from(grouped.values()).sort((a, b) => 
      a.supplier.name.localeCompare(b.supplier.name, 'de')
    );
  }, [filteredArticles, localItems]);

  const sessionStats = useMemo((): SessionStats => {
    let totalArticles = 0;
    let capturedArticles = 0;
    let totalValue = 0;

    groupedInventoryArticles.forEach(group => {
      totalArticles += group.articles.length;
      capturedArticles += group.capturedCount;
      totalValue += group.totalValue;
    });

    const progressPercent = totalArticles > 0 ? Math.round((capturedArticles / totalArticles) * 100) : 0;

    return {
      totalArticles,
      capturedArticles,
      totalValue,
      progressPercent,
    };
  }, [groupedInventoryArticles]);

  // Auto-save function with debouncing
  const autoSaveItem = useCallback((articleId: string, storage_1: number, storage_2: number) => {
    if (!activeSessionId || activeSession?.status === 'completed') return;
    
    const existingTimeout = saveTimeouts.current.get(articleId);
    if (existingTimeout) clearTimeout(existingTimeout);
    
    const timeout = setTimeout(async () => {
      const article = articles?.find(a => a.id === articleId);
      setSavingArticleIds(prev => new Set(prev).add(articleId));
      
      try {
        await upsertItem.mutateAsync({
          session_id: activeSessionId,
          article_id: articleId,
          storage_1,
          storage_2,
          unit_price: article?.price || 0,
        });
        
        setSavedArticleIds(prev => new Set(prev).add(articleId));
        setTimeout(() => {
          setSavedArticleIds(prev => {
            const next = new Set(prev);
            next.delete(articleId);
            return next;
          });
        }, 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        toast.error(t('inventory.saveError', 'Fehler beim Speichern'));
      } finally {
        setSavingArticleIds(prev => {
          const next = new Set(prev);
          next.delete(articleId);
          return next;
        });
        saveTimeouts.current.delete(articleId);
      }
    }, 800);
    
    saveTimeouts.current.set(articleId, timeout);
  }, [activeSessionId, activeSession?.status, articles, upsertItem, t]);

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
      const updated = { ...existing, [field]: numValue };
      newMap.set(articleId, updated);
      
      autoSaveItem(articleId, updated.storage_1, updated.storage_2);
      
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
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    setActiveSessionId(null);
  };

  const getItemValues = (articleId: string) => {
    const item = localItems.get(articleId);
    return {
      storage_1: item?.storage_1 || 0,
      storage_2: item?.storage_2 || 0,
      total: (item?.storage_1 || 0) + (item?.storage_2 || 0),
    };
  };

  return {
    // Data
    articles,
    suppliers,
    sessions,
    activeSession,
    units,
    categories,
    commonUnits,
    filteredArticles,
    groupedArticlesBySupplier,
    groupedInventoryArticles,
    sessionStats,
    localItems,
    
    // Loading states
    articlesLoading,
    sessionsLoading,
    
    // Session state
    activeSessionId,
    setActiveSessionId,
    
    // Filter state
    supplierFilter,
    setSupplierFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    
    // Changes state
    hasChanges,
    savingArticleIds,
    savedArticleIds,
    
    // Mutations
    createSession,
    updateSession,
    bulkUpsertItems,
    deleteSession,
    
    // Handlers
    handleItemChange,
    handleSave,
    handleComplete,
    getItemValues,
  };
}
