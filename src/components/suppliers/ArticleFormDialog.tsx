import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Article } from '@/hooks/useArticles';
import { Supplier } from '@/hooks/useSuppliers';
import { ArticleFormData } from './schemas';
import { ArticlePhotoCapture } from './ArticlePhotoCapture';
import { getErrorMessage } from '@/lib/errorUtils';
import {
  BasicInfoSection,
  PricingSection,
  SkuPackagingSection,
  CategorySection,
  WineDetailsSection,
  TranslationsSection,
  DescriptionSection,
  ReferencePriceSection,
  LocationAssignmentSection,
  FormActions,
  useArticleFormState,
} from './article-form';

interface ArticleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingArticle: Article | null;
  preselectedSupplierId?: string | null;
  suppliers: Supplier[];
  categories: string[];
  units: string[];
  onSubmit: (data: ArticleFormData, capturedImage?: string, imageCleared?: boolean, locationIds?: string[]) => Promise<void>;
  isPending: boolean;
  onDelete?: (article: Article) => void;
}

export const ArticleFormDialog = ({
  open,
  onOpenChange,
  editingArticle,
  preselectedSupplierId,
  suppliers,
  categories,
  units,
  onSubmit,
  isPending,
  onDelete
}: ArticleFormDialogProps) => {
  const isMobile = useIsMobile();
  
  const {
    form,
    isWineCategory,
    isAnalyzing,
    setIsAnalyzing,
    capturedImage,
    setCapturedImage,
    imageCleared,
    setImageCleared,
    advancedSettingsEnabled,
    organizationId,
    translationsOpen,
    setTranslationsOpen,
    selectedLocationIds,
    setSelectedLocationIds,
    orderUnits,
    createOrderUnit,
    locations,
    updateArticleLocations,
    descriptionRef,
    grapeVarietyRef,
    flavorProfileRef,
    foodPairingsRef,
  } = useArticleFormState({ open, editingArticle, preselectedSupplierId });

  const handleSubmit = async (data: ArticleFormData) => {
    if (editingArticle) {
      await onSubmit(data, capturedImage || undefined, imageCleared);
      // Update article locations if there are multiple locations
      if (locations.length > 1) {
        try {
          await updateArticleLocations.mutateAsync({
            articleId: editingArticle.id,
            locationIds: selectedLocationIds,
          });
        } catch (error) {
          console.error('Failed to update article locations:', getErrorMessage(error));
        }
      }
    } else {
      // For new articles, pass the selected location IDs
      await onSubmit(data, capturedImage || undefined, imageCleared, selectedLocationIds);
    }

    form.reset();
    setCapturedImage(null);
    setImageCleared(false);
  };

  const handleImageCaptured = (base64Image: string, result: {
    matched_article_id: string | null;
    matched_article_name: string | null;
    confidence: 'high' | 'medium' | 'low';
    suggested_name: string;
    suggested_description: string;
    suggested_category: string;
    suggested_unit: string;
  }) => {
    setCapturedImage(base64Image);

    // Auto-fill form fields with AI suggestions (only for new articles or if fields are empty)
    if (!editingArticle) {
      if (result.suggested_name && !form.getValues('name')) {
        form.setValue('name', result.suggested_name);
      }
      if (result.suggested_description && !form.getValues('description')) {
        form.setValue('description', result.suggested_description);
      }
      if (result.suggested_category && !form.getValues('category')) {
        if (categories.includes(result.suggested_category)) {
          form.setValue('category', result.suggested_category);
        }
      }
      if (result.suggested_unit && !form.getValues('unit')) {
        form.setValue('unit', result.suggested_unit);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto",
        isWineCategory ? "sm:max-w-2xl" : "sm:max-w-md"
      )}>
        <DialogHeader>
          <DialogTitle>
            {editingArticle
              ? `${suppliers?.find(s => s.id === editingArticle.supplier_id)?.name || ''} - Artikel bearbeiten`
              : 'Neuer Artikel'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* AI Photo Capture - only in advanced mode AND on mobile */}
          {advancedSettingsEnabled && isMobile && (
            <ArticlePhotoCapture
              supplierId={form.watch('supplier_id') || null}
              organizationId={organizationId}
              existingImageUrl={editingArticle?.image_url}
              onImageCaptured={handleImageCaptured}
              onImageCleared={() => {
                setCapturedImage(null);
                setImageCleared(true);
              }}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />
          )}

          {/* Basic Info (Supplier + Name) */}
          <BasicInfoSection
            form={form}
            editingArticle={editingArticle}
            preselectedSupplierId={preselectedSupplierId}
            suppliers={suppliers}
          />

          {/* Unit + Price + Order Unit */}
          <PricingSection
            form={form}
            units={units}
            orderUnits={orderUnits}
            createOrderUnit={createOrderUnit}
          />

          {/* SKU + Packaging Unit + BE Price */}
          <SkuPackagingSection
            form={form}
            orderUnits={orderUnits}
          />

          {/* Category + Origin Country */}
          <CategorySection
            form={form}
            categories={categories}
            isWineCategory={isWineCategory}
          />

          {/* Wine Details Section */}
          {isWineCategory && (
            <>
              <WineDetailsSection
                form={form}
                descriptionRef={descriptionRef}
                grapeVarietyRef={grapeVarietyRef}
                flavorProfileRef={flavorProfileRef}
                foodPairingsRef={foodPairingsRef}
                editingArticle={!!editingArticle}
              />
              <TranslationsSection
                form={form}
                editingArticleId={editingArticle?.id}
                translationsOpen={translationsOpen}
                setTranslationsOpen={setTranslationsOpen}
              />
            </>
          )}

          {/* Description for non-wine articles */}
          {!isWineCategory && <DescriptionSection form={form} />}

          {/* Reference Price */}
          <ReferencePriceSection form={form} units={units} />

          {/* Location Assignment */}
          <LocationAssignmentSection
            locations={locations}
            selectedLocationIds={selectedLocationIds}
            setSelectedLocationIds={setSelectedLocationIds}
          />

          {/* Form Actions */}
          <FormActions
            editingArticle={editingArticle}
            isPending={isPending}
            onClose={() => onOpenChange(false)}
            onDelete={onDelete}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
