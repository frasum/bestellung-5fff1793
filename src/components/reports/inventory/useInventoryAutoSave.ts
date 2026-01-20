import { useCallback, useEffect, useRef, useState } from 'react';
import { useUpsertInventoryItem } from '@/hooks/useInventory';
import { Article } from '@/hooks/useArticles';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface UseInventoryAutoSaveOptions {
  activeSessionId: string | null;
  sessionStatus: string | undefined;
  articles: Article[] | undefined;
}

export function useInventoryAutoSave({
  activeSessionId,
  sessionStatus,
  articles,
}: UseInventoryAutoSaveOptions) {
  const { t } = useTranslation();
  const upsertItem = useUpsertInventoryItem();
  
  const [savingArticleIds, setSavingArticleIds] = useState<Set<string>>(new Set());
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
  const saveTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      saveTimeouts.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  const autoSaveItem = useCallback((articleId: string, storage_1: number, storage_2: number) => {
    if (!activeSessionId || sessionStatus === 'completed') return;
    
    // Clear existing timeout for this article
    const existingTimeout = saveTimeouts.current.get(articleId);
    if (existingTimeout) clearTimeout(existingTimeout);
    
    // Set new timeout
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
        // Remove saved indicator after 2 seconds
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
    }, 800); // 800ms delay for debouncing
    
    saveTimeouts.current.set(articleId, timeout);
  }, [activeSessionId, sessionStatus, articles, upsertItem, t]);
  
  return {
    savingArticleIds,
    savedArticleIds,
    autoSaveItem,
  };
}
