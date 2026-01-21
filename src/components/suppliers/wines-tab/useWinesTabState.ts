import { useState, useMemo, useCallback, useEffect } from 'react';
import { Article, useUpdateArticle } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { generateWineCatalogPdf } from '@/lib/wineCatalogPdf';
import { FilterMode, BatchProgress, WineResearchResult } from './types';

export const useWinesTabState = (articles: Article[], suppliers: Supplier[]) => {
  const { t } = useTranslation();
  const [openSuppliers, setOpenSuppliers] = useState<Record<string, boolean>>({});
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [translateProgress, setTranslateProgress] = useState<BatchProgress | null>(null);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number } | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [advancedMode, setAdvancedMode] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );
  const [quizOpen, setQuizOpen] = useState(false);
  const [researchedIds, setResearchedIds] = useState<Set<string>>(new Set());
  const updateArticle = useUpdateArticle();

  useEffect(() => {
    const handleStorageChange = () => {
      setAdvancedMode(localStorage.getItem('advanced-settings-enabled') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter articles that have "wein" in category (case-insensitive)
  const wineArticles = useMemo(() => {
    return articles.filter(article => 
      article.category?.toLowerCase().includes('wein') ||
      article.top_category?.toLowerCase().includes('wein')
    );
  }, [articles]);

  // Count incomplete wines
  const incompleteCount = useMemo(() => {
    return wineArticles.filter(w => 
      !researchedIds.has(w.id) && (
        !w.description?.trim() || 
        !w.grape_variety?.trim() ||
        !w.origin_country?.trim() ||
        !w.image_url
      )
    ).length;
  }, [wineArticles, researchedIds]);

  // Filter wines based on filterMode
  const filteredWines = useMemo(() => {
    switch (filterMode) {
      case 'missing-description':
        return wineArticles.filter(w => !w.description?.trim());
      case 'missing-grape':
        return wineArticles.filter(w => !w.grape_variety?.trim());
      case 'missing-origin':
        return wineArticles.filter(w => !w.origin_country?.trim());
      case 'missing-price':
        return wineArticles.filter(w => !w.selling_price || w.selling_price === 0);
      case 'incomplete':
        return wineArticles.filter(w => 
          !w.description?.trim() || 
          !w.grape_variety?.trim() ||
          !w.origin_country?.trim() ||
          !w.image_url
        );
      default:
        return wineArticles;
    }
  }, [wineArticles, filterMode]);

  // Wines that need research
  const winesToResearch = useMemo(() => {
    return wineArticles.filter(wine => 
      !researchedIds.has(wine.id) && (
        !wine.description?.trim() || 
        !wine.origin_country?.trim() || 
        !wine.grape_variety?.trim()
      )
    );
  }, [wineArticles, researchedIds]);

  // Group wines by supplier
  const winesBySupplier = useMemo(() => {
    const grouped: Record<string, Article[]> = {};
    filteredWines.forEach(article => {
      if (!grouped[article.supplier_id]) {
        grouped[article.supplier_id] = [];
      }
      grouped[article.supplier_id].push(article);
    });
    Object.keys(grouped).forEach(supplierId => {
      grouped[supplierId].sort((a, b) => a.name.localeCompare(b.name));
    });
    return grouped;
  }, [filteredWines]);

  // Get suppliers that have wines
  const suppliersWithWines = useMemo(() => {
    return suppliers
      .filter(s => winesBySupplier[s.id]?.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [suppliers, winesBySupplier]);

  // PDF generation handler
  const handleGeneratePdf = useCallback(async () => {
    if (wineArticles.length === 0) return;
    
    setPdfProgress({ current: 0, total: wineArticles.length });
    
    try {
      await generateWineCatalogPdf(
        wineArticles,
        suppliers,
        undefined,
        (current, total) => setPdfProgress({ current, total })
      );
      toast.success(t('wines.pdfGenerated', 'Weinkatalog PDF erstellt'));
    } catch (error) {
      console.error('Error generating wine catalog PDF:', error);
      toast.error(t('wines.pdfError', 'Fehler beim Erstellen des PDFs'));
    } finally {
      setPdfProgress(null);
    }
  }, [wineArticles, suppliers, t]);

  // Batch research function
  const handleBatchResearch = useCallback(async () => {
    const winesForBatch = [...winesToResearch];
    
    if (winesForBatch.length === 0) {
      toast.info(t('wines.allWinesComplete', 'Alle Weine sind vollständig'));
      return;
    }

    const notFound = 'Keine Informationen gefunden';
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < winesForBatch.length; i++) {
      const wine = winesForBatch[i];
      setBatchProgress({ current: i + 1, total: winesForBatch.length, wineName: wine.name });

      try {
        const { data, error } = await supabase.functions.invoke('research-wine', {
          body: { wineName: wine.name, origin_country: wine.origin_country },
        });

        if (error) throw error;

        const result = data as WineResearchResult;
        
        const updateData: Record<string, string> = {};
        if (result.description !== notFound) updateData.description = result.description;
        if (result.grape_variety !== notFound) updateData.grape_variety = result.grape_variety;
        if (result.origin_country !== notFound) updateData.origin_country = result.origin_country;
        if (result.flavor_profile !== notFound) updateData.flavor_profile = result.flavor_profile;
        if (result.food_pairings !== notFound) updateData.food_pairings = result.food_pairings;

        if (Object.keys(updateData).length > 0) {
          await updateArticle.mutateAsync({ id: wine.id, ...updateData });
        }

        setResearchedIds(prev => new Set([...prev, wine.id]));
        successCount++;
      } catch (error) {
        console.error(`Error researching wine ${wine.name}:`, error);
        errorCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setBatchProgress(null);
    setResearchedIds(new Set());
    
    if (errorCount === 0) {
      toast.success(t('wines.batchResearchComplete', '{{count}} Weine erfolgreich recherchiert', { count: successCount }));
    } else {
      toast.warning(t('wines.batchResearchPartial', '{{success}} erfolgreich, {{errors}} Fehler', { success: successCount, errors: errorCount }));
    }
  }, [winesToResearch, updateArticle, t]);

  // Batch translate function
  const handleBatchTranslate = useCallback(async () => {
    setTranslateProgress({ current: 0, total: wineArticles.length * 3, wineName: '' });
    let successCount = 0;
    
    for (let i = 0; i < wineArticles.length; i++) {
      const wine = wineArticles[i];
      const langs = ['en', 'th', 'fr'] as const;
      const langLabels = { en: 'EN', th: 'TH', fr: 'FR' };
      
      for (let j = 0; j < langs.length; j++) {
        const lang = langs[j];
        setTranslateProgress({ 
          current: i * 3 + j + 1, 
          total: wineArticles.length * 3, 
          wineName: `${wine.name} (${langLabels[lang]})` 
        });
        
        try {
          await supabase.functions.invoke('translate-wine-content', {
            body: { articleId: wine.id, targetLanguage: lang },
          });
        } catch (error) {
          console.error(`Error translating ${wine.name} to ${lang}:`, error);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      successCount++;
    }
    
    setTranslateProgress(null);
    toast.success(t('wines.batchTranslateComplete', '{{count}} Weine übersetzt', { count: successCount }));
  }, [wineArticles, t]);

  return {
    // State
    openSuppliers,
    setOpenSuppliers,
    batchProgress,
    translateProgress,
    pdfProgress,
    filterMode,
    setFilterMode,
    advancedMode,
    quizOpen,
    setQuizOpen,
    updateArticle,
    
    // Computed
    wineArticles,
    incompleteCount,
    filteredWines,
    winesToResearch,
    winesBySupplier,
    suppliersWithWines,
    
    // Actions
    handleGeneratePdf,
    handleBatchResearch,
    handleBatchTranslate,
  };
};
