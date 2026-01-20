import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SupplierSession, Article, PendingChange, DraftData } from './types';
import { getErrorMessage } from '@/lib/errorUtils';

interface UseSupplierArticleEditingProps {
  session: SupplierSession | null;
  articles: Article[];
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>;
  pendingChanges: PendingChange[];
  setPendingChanges: React.Dispatch<React.SetStateAction<PendingChange[]>>;
  hasDraft: boolean;
  setHasDraft: React.Dispatch<React.SetStateAction<boolean>>;
  initialDraftData: DraftData | null;
}

export function useSupplierArticleEditing({
  session,
  articles,
  setArticles,
  pendingChanges,
  setPendingChanges,
  hasDraft,
  setHasDraft,
  initialDraftData,
}: UseSupplierArticleEditingProps) {
  const [saving, setSaving] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [editedArticles, setEditedArticles] = useState<Record<string, Partial<Article>>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [annualOrderValueInputs, setAnnualOrderValueInputs] = useState<Record<string, string>>({});
  const [orderUnitInputs, setOrderUnitInputs] = useState<Record<string, string>>({});
  const [descriptionInputs, setDescriptionInputs] = useState<Record<string, string>>({});
  const [referencePriceInputs, setReferencePriceInputs] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Initialize from draft
  useEffect(() => {
    if (initialDraftData) {
      setEditedArticles(initialDraftData.editedArticles || {});
      setPriceInputs(initialDraftData.priceInputs || {});
      setAnnualOrderValueInputs(initialDraftData.annualOrderValueInputs || {});
      setOrderUnitInputs(initialDraftData.orderUnitInputs || {});
      setDescriptionInputs(initialDraftData.descriptionInputs || {});
    }
  }, [initialDraftData]);

  const handleFieldChange = (articleId: string, field: keyof Article, value: any) => {
    setEditedArticles(prev => ({
      ...prev,
      [articleId]: {
        ...prev[articleId],
        [field]: value,
      },
    }));
  };

  const handleSaveDraft = async () => {
    if (!session) return;
    
    setSavingDraft(true);
    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'save-draft',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          draftData: {
            editedArticles,
            priceInputs,
            annualOrderValueInputs,
            orderUnitInputs,
            descriptionInputs,
          },
        },
      });

      if (error) throw error;
      setHasDraft(true);
      toast.success('Entwurf gespeichert');
    } catch (error: unknown) {
      console.error('Error saving draft:', error);
      toast.error('Fehler beim Speichern des Entwurfs');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!session) return;
    
    try {
      await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'delete-draft',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
        },
      });
      setHasDraft(false);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handleSave = async (articleId: string) => {
    const changes = { ...editedArticles[articleId] };
    if (!session) return;
    
    if (priceInputs[articleId] !== undefined) {
      const priceValue = priceInputs[articleId].replace(',', '.');
      const parsed = parseFloat(priceValue);
      if (!isNaN(parsed)) {
        changes.price = parsed;
      }
    }

    if (annualOrderValueInputs[articleId] !== undefined) {
      const aoValue = annualOrderValueInputs[articleId].replace(',', '.');
      const parsed = parseFloat(aoValue);
      if (!isNaN(parsed)) {
        changes.annual_order_value = parsed;
      } else if (annualOrderValueInputs[articleId] === '') {
        changes.annual_order_value = null;
      }
    }

    if (orderUnitInputs[articleId] !== undefined) {
      const puValue = orderUnitInputs[articleId];
      const parsed = parseInt(puValue, 10);
      if (!isNaN(parsed) && parsed > 0) {
        changes.packaging_unit = parsed;
      } else if (puValue === '') {
        changes.packaging_unit = null;
      }
    }

    if (descriptionInputs[articleId] !== undefined) {
      changes.description = descriptionInputs[articleId] || null;
    }
    
    if (!changes || Object.keys(changes).length === 0) return;

    setSaving(articleId);
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'update',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleId,
          changes,
        },
      });

      if (error) throw error;

      if (data?.pendingChanges) {
        setPendingChanges(prev => [...prev, ...data.pendingChanges]);
      }
      
      // Clear edited state for this article
      setEditedArticles(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });
      setPriceInputs(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });
      setAnnualOrderValueInputs(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });
      setOrderUnitInputs(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });
      setDescriptionInputs(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });

      if (hasDraft) {
        await handleDeleteDraft();
      }

      toast.success('Änderungen zur Genehmigung eingereicht');
    } catch (error: unknown) {
      console.error('Error saving article:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    if (!session || !hasAnyChanges()) return;

    setSavingAll(true);
    try {
      const changedIds = new Set([
        ...Object.keys(editedArticles),
        ...Object.keys(priceInputs),
        ...Object.keys(annualOrderValueInputs),
        ...Object.keys(orderUnitInputs),
      ]);

      const articleChanges: Array<{ articleId: string; changes: Record<string, any> }> = [];
      
      for (const articleId of changedIds) {
        const changes: Record<string, any> = { ...editedArticles[articleId] };
        
        if (priceInputs[articleId] !== undefined) {
          const priceValue = priceInputs[articleId].replace(',', '.');
          const parsed = parseFloat(priceValue);
          if (!isNaN(parsed)) {
            changes.price = parsed;
          }
        }

        if (annualOrderValueInputs[articleId] !== undefined) {
          const aoValue = annualOrderValueInputs[articleId].replace(',', '.');
          const parsed = parseFloat(aoValue);
          if (!isNaN(parsed)) {
            changes.annual_order_value = parsed;
          } else if (annualOrderValueInputs[articleId] === '') {
            changes.annual_order_value = null;
          }
        }

        if (orderUnitInputs[articleId] !== undefined) {
          const puValue = orderUnitInputs[articleId];
          const parsed = parseInt(puValue, 10);
          if (!isNaN(parsed) && parsed > 0) {
            changes.packaging_unit = parsed;
          } else if (puValue === '') {
            changes.packaging_unit = null;
          }
        }

        if (Object.keys(changes).length > 0) {
          articleChanges.push({ articleId, changes });
        }
      }

      if (articleChanges.length === 0) {
        toast.info('Keine Änderungen zum Einreichen');
        return;
      }

      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'update-all',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleChanges,
        },
      });

      if (error) throw error;

      if (data?.pendingChanges) {
        setPendingChanges(prev => [...prev, ...data.pendingChanges]);
      }

      setEditedArticles({});
      setPriceInputs({});
      setAnnualOrderValueInputs({});
      setOrderUnitInputs({});

      if (hasDraft) {
        await handleDeleteDraft();
      }

      const changeCount = data?.pendingChanges?.length || articleChanges.length;
      toast.success(`${changeCount} Änderung${changeCount > 1 ? 'en' : ''} zur Genehmigung eingereicht`);
    } catch (error: unknown) {
      console.error('Error saving all articles:', error);
      toast.error('Fehler beim Einreichen der Änderungen');
    } finally {
      setSavingAll(false);
    }
  };

  const handleImageUpload = async (articleId: string, base64Image: string) => {
    if (!session) return;
    
    setUploadingImage(articleId);
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'upload-image',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleId,
          base64Image,
        },
      });

      if (error) throw error;

      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, image_url: data.imageUrl } : a
      ));

      toast.success('Foto hochgeladen');
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      toast.error('Fehler beim Hochladen des Fotos');
      throw error;
    } finally {
      setUploadingImage(null);
    }
  };

  const handleFileUpload = async (articleId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        await handleImageUpload(articleId, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageDelete = async (articleId: string) => {
    if (!session) return;
    
    setUploadingImage(articleId);
    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'delete-image',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleId,
        },
      });

      if (error) throw error;

      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, image_url: null } : a
      ));

      toast.success('Foto gelöscht');
    } catch (error: unknown) {
      console.error('Error deleting image:', error);
      toast.error('Fehler beim Löschen des Fotos');
    } finally {
      setUploadingImage(null);
    }
  };

  const getDisplayValue = (article: Article, field: keyof Article) => {
    if (editedArticles[article.id]?.[field] !== undefined) {
      return editedArticles[article.id][field];
    }
    return article[field];
  };

  const hasChanges = (articleId: string) => {
    const hasFieldChanges = !!editedArticles[articleId] && Object.keys(editedArticles[articleId]).length > 0;
    const hasPriceChange = priceInputs[articleId] !== undefined;
    const hasAOVChange = annualOrderValueInputs[articleId] !== undefined;
    const hasPUChange = orderUnitInputs[articleId] !== undefined;
    const hasDescChange = descriptionInputs[articleId] !== undefined;
    return hasFieldChanges || hasPriceChange || hasAOVChange || hasPUChange || hasDescChange;
  };

  const hasAnyChanges = () => {
    return Object.keys(editedArticles).length > 0 || 
           Object.keys(priceInputs).length > 0 || 
           Object.keys(annualOrderValueInputs).length > 0 ||
           Object.keys(orderUnitInputs).length > 0 ||
           Object.keys(descriptionInputs).length > 0;
  };

  const getChangedArticleCount = () => {
    const changedIds = new Set([
      ...Object.keys(editedArticles),
      ...Object.keys(priceInputs),
      ...Object.keys(annualOrderValueInputs),
      ...Object.keys(orderUnitInputs),
    ]);
    return changedIds.size;
  };

  const getPendingChangesForArticle = (articleId: string) => {
    return pendingChanges.filter(c => c.article_id === articleId && c.status === 'pending');
  };

  const getPendingChangeForField = (articleId: string, fieldName: string) => {
    return pendingChanges.find(
      c => c.article_id === articleId && c.field_name === fieldName && c.status === 'pending'
    );
  };

  const hasPendingChange = (articleId: string, fieldName: string) => {
    return !!getPendingChangeForField(articleId, fieldName);
  };

  return {
    saving,
    savingDraft,
    savingAll,
    editedArticles,
    priceInputs,
    setPriceInputs,
    annualOrderValueInputs,
    setAnnualOrderValueInputs,
    orderUnitInputs,
    setOrderUnitInputs,
    descriptionInputs,
    setDescriptionInputs,
    referencePriceInputs,
    setReferencePriceInputs,
    uploadingImage,
    handleFieldChange,
    handleSaveDraft,
    handleDeleteDraft,
    handleSave,
    handleSaveAll,
    handleImageUpload,
    handleFileUpload,
    handleImageDelete,
    getDisplayValue,
    hasChanges,
    hasAnyChanges,
    getChangedArticleCount,
    getPendingChangesForArticle,
    getPendingChangeForField,
    hasPendingChange,
  };
}
