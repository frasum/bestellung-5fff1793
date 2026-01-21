import React, { memo } from 'react';
import { Supplier, SupplierInput } from '@/hooks/useSuppliers';
import { Article } from '@/hooks/useArticles';
import { ArticleFormData } from '@/components/suppliers/schemas';
import { SupplierFormDialog } from '@/components/suppliers/SupplierFormDialog';
import { ArticleFormDialog } from '@/components/suppliers/ArticleFormDialog';
import { DeleteConfirmationDialogs } from '@/components/suppliers/DeleteConfirmationDialogs';
import { SupplierChangesDialog } from '@/components/suppliers/SupplierChangesDialog';
import { SupplierLocationsDialog } from '@/components/suppliers/SupplierLocationsDialog';
import { SupplierQRCodeDialog } from '@/components/suppliers/SupplierQRCodeDialog';
import { SupplierTokensDialog } from '@/components/suppliers/SupplierTokensDialog';
import { QuickCaptureWizard } from '@/components/suppliers/QuickCaptureWizard';
import { MergeSuppliersDialog } from '@/components/suppliers/MergeSuppliersDialog';
import { CsvImportDialog } from '@/components/CsvImportDialog';
import { UpgradeDialog } from '@/components/subscription/UpgradeDialog';
import { AddArticleSheet } from '@/components/cart/AddArticleSheet';
import { SUPPLIER_IMPORT_FIELDS, ARTICLE_IMPORT_FIELDS } from '@/components/suppliers/constants';

interface SuppliersDialogsProps {
  // Supplier dialog
  isSupplierDialogOpen: boolean;
  editingSupplier: Supplier | null;
  onSupplierDialogChange: (open: boolean) => void;
  onSupplierSubmit: (input: SupplierInput) => Promise<void>;
  onImportArticles: (supplierId: string) => void;
  isSupplierPending: boolean;
  
  // Article dialog
  isArticleDialogOpen: boolean;
  editingArticle: Article | null;
  preselectedSupplierId: string | null;
  onArticleDialogChange: (open: boolean) => void;
  onArticleSubmit: (data: ArticleFormData, capturedImage?: string, imageCleared?: boolean, locationIds?: string[]) => Promise<void>;
  onArticleDeleteFromForm: (article: Article) => void;
  isArticlePending: boolean;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  
  // Delete dialogs
  deletingSupplier: Supplier | null;
  deletingArticle: Article | null;
  onSupplierDeleteClose: () => void;
  onSupplierDelete: () => Promise<void>;
  isSupplierDeleting: boolean;
  onArticleDeleteClose: () => void;
  onArticleDeleteConfirm: () => Promise<void>;
  isArticleDeleting: boolean;
  
  // Changes dialog
  changesDialogSupplier: Supplier | null;
  changesDialogArticle: { id: string; name: string } | null;
  onChangesDialogClose: () => void;
  
  // Locations dialog
  locationsDialogSupplier: Supplier | null;
  onLocationsDialogClose: () => void;
  
  // QR Code dialog
  qrCodeSupplier: Supplier | null;
  onQRCodeDialogClose: () => void;
  
  // Tokens dialog
  tokensDialogSupplier: Supplier | null;
  onTokensDialogClose: () => void;
  
  // Upgrade dialog
  showUpgradeDialog: boolean;
  onUpgradeDialogChange: (open: boolean) => void;
  subscriptionTier: string;
  suppliersCount: number;
  suppliersLimit: number | 'unlimited';
  
  // Quick capture
  isQuickCaptureOpen: boolean;
  onQuickCaptureChange: (open: boolean) => void;
  onCreateSupplier: (input: SupplierInput) => Promise<Supplier>;
  onCreateArticle: (input: any) => Promise<Article>;
  onUploadImage: (base64: string, orgId: string, articleId: string) => Promise<string | null>;
  organizationId: string | null;
  
  // Merge dialog
  isMergeOpen: boolean;
  onMergeChange: (open: boolean) => void;
  allArticles: Article[];
  
  // Import dialogs
  isSupplierImportOpen: boolean;
  onSupplierImportChange: (open: boolean) => void;
  onImportSuppliers: (data: any[]) => Promise<number | void>;
  articleImportSupplierId: string | null;
  onArticleImportClose: () => void;
  onImportArticlesData: (data: { articles: any[]; defaultSupplierId: string }) => Promise<number | void>;
  
  // Add article sheet
  addArticleSheet: { open: boolean; supplierId: string; supplierName: string };
  onAddArticleSheetChange: (open: boolean) => void;
}

export const SuppliersDialogs = memo(function SuppliersDialogs({
  isSupplierDialogOpen,
  editingSupplier,
  onSupplierDialogChange,
  onSupplierSubmit,
  onImportArticles,
  isSupplierPending,
  isArticleDialogOpen,
  editingArticle,
  preselectedSupplierId,
  onArticleDialogChange,
  onArticleSubmit,
  onArticleDeleteFromForm,
  isArticlePending,
  suppliers,
  categories,
  units,
  deletingSupplier,
  deletingArticle,
  onSupplierDeleteClose,
  onSupplierDelete,
  isSupplierDeleting,
  onArticleDeleteClose,
  onArticleDeleteConfirm,
  isArticleDeleting,
  changesDialogSupplier,
  changesDialogArticle,
  onChangesDialogClose,
  locationsDialogSupplier,
  onLocationsDialogClose,
  qrCodeSupplier,
  onQRCodeDialogClose,
  tokensDialogSupplier,
  onTokensDialogClose,
  showUpgradeDialog,
  onUpgradeDialogChange,
  subscriptionTier,
  suppliersCount,
  suppliersLimit,
  isQuickCaptureOpen,
  onQuickCaptureChange,
  onCreateSupplier,
  onCreateArticle,
  onUploadImage,
  organizationId,
  isMergeOpen,
  onMergeChange,
  allArticles,
  isSupplierImportOpen,
  onSupplierImportChange,
  onImportSuppliers,
  articleImportSupplierId,
  onArticleImportClose,
  onImportArticlesData,
  addArticleSheet,
  onAddArticleSheetChange,
}: SuppliersDialogsProps) {
  return (
    <>
      {/* Supplier Form Dialog */}
      <SupplierFormDialog
        open={isSupplierDialogOpen}
        onOpenChange={onSupplierDialogChange}
        editingSupplier={editingSupplier}
        onSubmit={onSupplierSubmit}
        onImportArticles={onImportArticles}
        isPending={isSupplierPending}
      />

      {/* Article Form Dialog */}
      <ArticleFormDialog
        open={isArticleDialogOpen}
        onOpenChange={onArticleDialogChange}
        editingArticle={editingArticle}
        preselectedSupplierId={preselectedSupplierId}
        suppliers={suppliers}
        categories={categories}
        units={units}
        onSubmit={onArticleSubmit}
        isPending={isArticlePending}
        onDelete={onArticleDeleteFromForm}
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmationDialogs
        deletingSupplier={deletingSupplier}
        onSupplierClose={onSupplierDeleteClose}
        onSupplierDelete={onSupplierDelete}
        isSupplierDeleting={isSupplierDeleting}
        deletingArticle={deletingArticle}
        onArticleClose={onArticleDeleteClose}
        onArticleDelete={onArticleDeleteConfirm}
        isArticleDeleting={isArticleDeleting}
      />

      {/* Supplier Changes Dialog */}
      <SupplierChangesDialog
        open={!!changesDialogSupplier}
        onOpenChange={(open) => !open && onChangesDialogClose()}
        supplierId={changesDialogSupplier?.id || null}
        supplierName={changesDialogSupplier?.name || ''}
        articleId={changesDialogArticle?.id}
        articleName={changesDialogArticle?.name}
      />

      {/* Supplier Locations Dialog */}
      {locationsDialogSupplier && (
        <SupplierLocationsDialog
          open={!!locationsDialogSupplier}
          onOpenChange={(open) => !open && onLocationsDialogClose()}
          supplier={locationsDialogSupplier}
        />
      )}

      {/* QR Code Dialog */}
      <SupplierQRCodeDialog
        supplier={qrCodeSupplier}
        open={!!qrCodeSupplier}
        onOpenChange={(open) => !open && onQRCodeDialogClose()}
      />

      {/* Tokens Dialog */}
      <SupplierTokensDialog
        open={!!tokensDialogSupplier}
        onOpenChange={(open) => !open && onTokensDialogClose()}
        supplier={tokensDialogSupplier}
      />

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={onUpgradeDialogChange}
        limitType="suppliers"
        currentTier={subscriptionTier}
        currentUsage={suppliersCount}
        limit={suppliersLimit}
      />

      {/* Quick Capture Wizard */}
      <QuickCaptureWizard
        open={isQuickCaptureOpen}
        onOpenChange={onQuickCaptureChange}
        suppliers={suppliers}
        categories={categories}
        units={units}
        onCreateSupplier={onCreateSupplier}
        onCreateArticle={onCreateArticle}
        onUploadImage={onUploadImage}
        organizationId={organizationId}
      />

      {/* Merge Suppliers Dialog */}
      <MergeSuppliersDialog
        open={isMergeOpen}
        onOpenChange={onMergeChange}
        suppliers={suppliers}
        articles={allArticles}
      />

      {/* Supplier Import Dialog */}
      <CsvImportDialog
        open={isSupplierImportOpen}
        onOpenChange={onSupplierImportChange}
        title="Lieferanten importieren"
        fields={SUPPLIER_IMPORT_FIELDS}
        onImport={async (data) => { await onImportSuppliers(data); }}
        templateFileName="suppliers_template.csv"
      />

      {/* Article Import Dialog */}
      <CsvImportDialog
        open={!!articleImportSupplierId}
        onOpenChange={(open) => !open && onArticleImportClose()}
        title={`Artikel importieren für ${suppliers.find(s => s.id === articleImportSupplierId)?.name || 'Lieferant'}`}
        fields={ARTICLE_IMPORT_FIELDS}
        onImport={async (data) => {
          if (articleImportSupplierId) {
            await onImportArticlesData({ articles: data, defaultSupplierId: articleImportSupplierId });
          }
        }}
        templateFileName="articles_template.csv"
      />

      {/* Add Article Sheet */}
      <AddArticleSheet
        open={addArticleSheet.open}
        onOpenChange={onAddArticleSheetChange}
        supplierId={addArticleSheet.supplierId}
        supplierName={addArticleSheet.supplierName}
      />
    </>
  );
});
