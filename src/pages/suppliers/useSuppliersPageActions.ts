import { useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useCreateSupplier, useUpdateSupplier, useDeleteSupplier, Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { useCreateArticle, useUpdateArticle, useDeleteArticle, useBulkUpdateArticles, Article, ArticleInput } from '@/hooks/useArticles';
import { useCreateArticleLocationsForNewArticle } from '@/hooks/useArticleLocations';
import { useImportSuppliers, useImportArticles } from '@/hooks/useImport';
import { useSendSupplierInvitation } from '@/hooks/useSupplierPortal';
import { useArticleImageUpload } from '@/hooks/useArticleImageUpload';
import { useSubscriptionLimits } from '@/hooks/useSubscriptionLimits';
import { generateOrderListPdf, generateCombinedOrderListPdf } from '@/lib/orderListPdf';
import { ArticleFormData } from '@/components/suppliers/schemas';

interface UseSuppliersPageActionsProps {
  organizationName: string;
  setInvitingSupplierId: (id: string | null) => void;
  setShowSupplierUpgradeDialog: (show: boolean) => void;
  setSupplierDialog: (state: { isOpen: boolean; editingSupplier: Supplier | null }) => void;
  setArticleDialog: (state: { isOpen: boolean; editingArticle: Article | null; preselectedSupplierId: string | null }) => void;
  setDeleteState: (state: { deletingSupplier: Supplier | null; deletingArticle: Article | null }) => void;
  selectedSuppliers: Set<string>;
  setSelectedSuppliers: (suppliers: Set<string>) => void;
  selectedArticles: Set<string>;
  setSelectedArticles: (articles: Set<string>) => void;
  suppliers: Supplier[] | undefined;
  articlesBySupplier: Record<string, Article[]>;
  filteredSuppliers: Supplier[] | undefined;
  lastOrderMap: Record<string, { quantity: number; date: string }> | undefined;
}

export const useSuppliersPageActions = ({
  organizationName,
  setInvitingSupplierId,
  setShowSupplierUpgradeDialog,
  setSupplierDialog,
  setArticleDialog,
  setDeleteState,
  selectedSuppliers,
  setSelectedSuppliers,
  selectedArticles,
  setSelectedArticles,
  suppliers,
  articlesBySupplier,
  filteredSuppliers,
  lastOrderMap,
}: UseSuppliersPageActionsProps) => {
  // Mutations
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const deleteSupplier = useDeleteSupplier();
  const importSuppliers = useImportSuppliers();
  
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();
  const deleteArticle = useDeleteArticle();
  const bulkUpdateArticles = useBulkUpdateArticles();
  const importArticles = useImportArticles();
  const createArticleLocations = useCreateArticleLocationsForNewArticle();
  
  const { sendInvitation, loading: sendingInvitation } = useSendSupplierInvitation();
  const { uploadImage, deleteImage } = useArticleImageUpload();
  const subscriptionLimits = useSubscriptionLimits();

  // Supplier handlers
  const handleSendInvitation = useCallback(async (supplier: Supplier) => {
    setInvitingSupplierId(supplier.id);
    await sendInvitation(supplier.id, supplier.email, supplier.name, organizationName);
    setInvitingSupplierId(null);
  }, [sendInvitation, organizationName, setInvitingSupplierId]);

  const handleOpenPortal = useCallback(async (supplier: Supplier) => {
    const newWindow = window.open('', '_blank');
    try {
      const { data, error } = await supabase.functions.invoke('create-supplier-portal-token', {
        body: { supplierId: supplier.id }
      });
      if (error) throw error;
      if (newWindow) newWindow.location.href = data.portalUrl;
    } catch (error: unknown) {
      console.error('Error opening portal:', error);
      if (newWindow) newWindow.close();
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast.error('Fehler beim Öffnen des Portals: ' + message);
    }
  }, []);

  const handleOpenSupplierDialog = useCallback(() => {
    if (!subscriptionLimits.canAddSupplier) {
      setShowSupplierUpgradeDialog(true);
      return;
    }
    setSupplierDialog({ isOpen: true, editingSupplier: null });
  }, [subscriptionLimits.canAddSupplier, setShowSupplierUpgradeDialog, setSupplierDialog]);

  const handleSupplierSubmit = useCallback(async (input: SupplierInput, editingSupplier: Supplier | null) => {
    if (editingSupplier) {
      await updateSupplier.mutateAsync({ id: editingSupplier.id, ...input });
    } else {
      if (!subscriptionLimits.canAddSupplier) {
        setShowSupplierUpgradeDialog(true);
        return;
      }
      await createSupplier.mutateAsync(input);
    }
    setSupplierDialog({ isOpen: false, editingSupplier: null });
  }, [createSupplier, updateSupplier, subscriptionLimits.canAddSupplier, setShowSupplierUpgradeDialog, setSupplierDialog]);

  const handleSupplierDelete = useCallback(async (deletingSupplier: Supplier | null) => {
    if (deletingSupplier) {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      setDeleteState({ deletingSupplier: null, deletingArticle: null });
    }
  }, [deleteSupplier, setDeleteState]);

  const selectAllSuppliers = useCallback(() => {
    const suppliersWithArticles = filteredSuppliers?.filter(s => (articlesBySupplier[s.id]?.length || 0) > 0) || [];
    if (selectedSuppliers.size === suppliersWithArticles.length) {
      setSelectedSuppliers(new Set());
    } else {
      setSelectedSuppliers(new Set(suppliersWithArticles.map(s => s.id)));
    }
  }, [filteredSuppliers, articlesBySupplier, selectedSuppliers.size, setSelectedSuppliers]);

  const handlePrintCombined = useCallback(async () => {
    const selectedSuppliersData = suppliers?.filter(s => selectedSuppliers.has(s.id)) || [];
    const enrichedArticlesBySupplier = Object.fromEntries(
      Object.entries(articlesBySupplier).map(([supplierId, articles]) => [
        supplierId, 
        articles.map(a => ({
          name: a.name,
          unit: a.unit,
          sku: a.sku,
          description: a.description,
          lastOrderQuantity: lastOrderMap?.[a.id]?.quantity,
          lastOrderDate: lastOrderMap?.[a.id]?.date
        }))
      ])
    );
    await generateCombinedOrderListPdf(selectedSuppliersData, enrichedArticlesBySupplier);
    setSelectedSuppliers(new Set());
  }, [suppliers, selectedSuppliers, articlesBySupplier, lastOrderMap, setSelectedSuppliers]);

  // Article handlers
  const handleArticleSubmit = useCallback(async (
    data: ArticleFormData, 
    editingArticle: Article | null,
    capturedImage?: string, 
    imageCleared?: boolean, 
    locationIds?: string[]
  ) => {
    const input: ArticleInput = {
      supplier_id: data.supplier_id,
      name: data.name,
      description: data.description || undefined,
      sku: data.sku || undefined,
      unit: data.unit,
      price: Number(data.price),
      category: data.category || undefined,
      origin_country: data.origin_country || undefined,
      packaging_unit: data.packaging_unit ? Number(data.packaging_unit) : undefined,
      order_unit_id: data.order_unit_id || undefined,
      reference_price: data.reference_price ? Number(data.reference_price.replace(',', '.')) : undefined,
      reference_unit: data.reference_unit || undefined,
      selling_price: data.selling_price ? Number(data.selling_price) : undefined,
      grape_variety: data.grape_variety || undefined,
      flavor_profile: data.flavor_profile || undefined,
      food_pairings: data.food_pairings || undefined
    };

    if (editingArticle) {
      if (imageCleared && editingArticle.image_url) {
        await deleteImage(editingArticle.organization_id, editingArticle.id);
        input.image_url = null;
      } else if (capturedImage && capturedImage.startsWith('data:')) {
        if (editingArticle.image_url) {
          await deleteImage(editingArticle.organization_id, editingArticle.id);
        }
        const imageUrl = await uploadImage(capturedImage, editingArticle.organization_id, editingArticle.id);
        if (imageUrl) input.image_url = imageUrl;
      }
      await updateArticle.mutateAsync({ id: editingArticle.id, ...input });
    } else {
      const newArticle = await createArticle.mutateAsync(input);
      if (newArticle) {
        await createArticleLocations.mutateAsync({
          articleId: newArticle.id,
          organizationId: newArticle.organization_id,
          locationIds,
        });
        
        if (capturedImage && capturedImage.startsWith('data:')) {
          const imageUrl = await uploadImage(capturedImage, newArticle.organization_id, newArticle.id);
          if (imageUrl) {
            await updateArticle.mutateAsync({ id: newArticle.id, image_url: imageUrl });
          }
        }
      }
    }
    setArticleDialog({ isOpen: false, editingArticle: null, preselectedSupplierId: null });
  }, [createArticle, updateArticle, createArticleLocations, uploadImage, deleteImage, setArticleDialog]);

  const handleArticleDelete = useCallback(async (deletingArticle: Article | null) => {
    if (deletingArticle) {
      await deleteArticle.mutateAsync(deletingArticle.id);
      setDeleteState({ deletingSupplier: null, deletingArticle: null });
    }
  }, [deleteArticle, setDeleteState]);

  const handleBulkCategoryAssign = useCallback(async (category: string | null) => {
    if (selectedArticles.size === 0) return;
    await bulkUpdateArticles.mutateAsync({
      ids: Array.from(selectedArticles),
      updates: { category: category || undefined }
    });
    setSelectedArticles(new Set());
  }, [selectedArticles, bulkUpdateArticles, setSelectedArticles]);

  const handleBulkOrderUnitAssign = useCallback(async (orderUnitId: string | null) => {
    if (selectedArticles.size === 0) return;
    await bulkUpdateArticles.mutateAsync({
      ids: Array.from(selectedArticles),
      updates: { order_unit_id: orderUnitId || undefined }
    });
    setSelectedArticles(new Set());
  }, [selectedArticles, bulkUpdateArticles, setSelectedArticles]);

  return {
    // Mutations
    createSupplier,
    updateSupplier,
    deleteSupplier,
    importSuppliers,
    createArticle,
    updateArticle,
    deleteArticle,
    importArticles,
    uploadImage,
    
    // Subscription
    subscriptionLimits,
    
    // Invitation
    sendingInvitation,
    
    // Handlers
    handleSendInvitation,
    handleOpenPortal,
    handleOpenSupplierDialog,
    handleSupplierSubmit,
    handleSupplierDelete,
    selectAllSuppliers,
    handlePrintCombined,
    handleArticleSubmit,
    handleArticleDelete,
    handleBulkCategoryAssign,
    handleBulkOrderUnitAssign,
  };
};
