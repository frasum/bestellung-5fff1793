import {
  usePhotoCaptureState,
  PhotoCaptureHeader,
  SinglePhotoStep,
  ArticleDetailsStep,
  SupplierSelectionStep,
  ConfirmationStep,
  BatchProcessingStep,
  BatchReviewStep,
  BatchPhotosStep,
  LoadingState,
  ErrorState,
} from './photo-capture';

const PhotoCapture = () => {
  const state = usePhotoCaptureState();
  
  const steps = state.getSteps();
  const currentStepIndex = steps.indexOf(state.step as string);

  // Loading state
  if (state.step === 'loading') {
    return <LoadingState />;
  }

  // Error state
  if (state.step === 'error') {
    return <ErrorState errorMessage={state.errorMessage} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PhotoCaptureHeader
        organizationName={state.organizationName}
        step={state.step}
        batchMode={state.batchMode}
        setBatchMode={state.setBatchMode}
        setStep={state.setStep}
        setCapturedImages={() => state.setCapturedImages([])}
        setPreviewImage={() => state.setPreviewImage(null)}
        steps={steps}
        currentStepIndex={currentStepIndex}
      />

      <main className="flex-1 p-4 pb-safe overflow-y-auto">
        {/* Single Mode: Photo Step */}
        {state.step === 'photo' && !state.batchMode && (
          <SinglePhotoStep
            previewImage={state.previewImage}
            isAnalyzing={state.isAnalyzing}
            fileInputRef={state.fileInputRef}
            cameraInputRef={state.cameraInputRef}
            onFileSelect={state.handleFileSelect}
            onClearPreview={() => {
              state.setPreviewImage(null);
              state.setIdentificationResult(null);
            }}
          />
        )}

        {/* Batch Mode: Photo Collection */}
        {state.step === 'batch-photos' && state.batchMode && (
          <BatchPhotosStep
            capturedImages={state.capturedImages}
            onAddImage={state.handleAddBatchImage}
            onRemoveImage={state.handleRemoveBatchImage}
            onProcessAll={state.processBatchImages}
          />
        )}

        {/* Batch Mode: Processing */}
        {state.step === 'batch-processing' && (
          <BatchProcessingStep batchProgress={state.batchProgress} />
        )}

        {/* Batch Mode: Article Review Carousel */}
        {state.step === 'batch-review' && (
          <BatchReviewStep
            batchArticles={state.batchArticles}
            currentBatchIndex={state.currentBatchIndex}
            setCurrentBatchIndex={state.setCurrentBatchIndex}
            onArticleChange={state.handleBatchArticleChange}
            onSkipArticle={state.handleSkipArticle}
            categories={state.categories}
            units={state.units}
            canProceedToSupplier={!!state.canProceedToSupplier}
            onBack={() => state.setStep('batch-photos')}
            onNext={() => state.setStep('supplier')}
          />
        )}

        {/* Single Mode: Article Details */}
        {state.step === 'article' && !state.batchMode && (
          <ArticleDetailsStep
            previewImage={state.previewImage}
            identificationResult={state.identificationResult}
            articleName={state.articleName}
            setArticleName={state.setArticleName}
            articleDescription={state.articleDescription}
            setArticleDescription={state.setArticleDescription}
            articleCategory={state.articleCategory}
            setArticleCategory={state.setArticleCategory}
            articleUnit={state.articleUnit}
            setArticleUnit={state.setArticleUnit}
            articlePrice={state.articlePrice}
            setArticlePrice={state.setArticlePrice}
            articleSku={state.articleSku}
            setArticleSku={state.setArticleSku}
            categories={state.categories}
            units={state.units}
            canProceed={!!state.canProceedToSupplier}
            onBack={() => state.setStep('photo')}
            onNext={() => state.setStep('supplier')}
          />
        )}

        {/* Supplier Selection */}
        {state.step === 'supplier' && (
          <SupplierSelectionStep
            batchMode={state.batchMode}
            batchArticles={state.batchArticles}
            suppliers={state.suppliers}
            filteredSuppliers={state.filteredSuppliers}
            supplierMode={state.supplierMode}
            setSupplierMode={state.setSupplierMode}
            supplierSearch={state.supplierSearch}
            setSupplierSearch={state.setSupplierSearch}
            selectedSupplierId={state.selectedSupplierId}
            setSelectedSupplierId={state.setSelectedSupplierId}
            newSupplierName={state.newSupplierName}
            setNewSupplierName={state.setNewSupplierName}
            newSupplierEmail={state.newSupplierEmail}
            setNewSupplierEmail={state.setNewSupplierEmail}
            newSupplierPhone={state.newSupplierPhone}
            setNewSupplierPhone={state.setNewSupplierPhone}
            newSupplierCustomerNumber={state.newSupplierCustomerNumber}
            setNewSupplierCustomerNumber={state.setNewSupplierCustomerNumber}
            canSave={!!state.canSave}
            isSaving={state.isSaving}
            onBack={() => state.setStep(state.batchMode ? 'batch-review' : 'article')}
            onSave={state.batchMode ? state.handleSaveBatch : state.handleSaveSingle}
          />
        )}

        {/* Confirmation */}
        {state.step === 'confirm' && (
          <ConfirmationStep
            batchMode={state.batchMode}
            batchResult={state.batchResult}
            articleName={state.articleName}
            onCaptureMore={() => {
              state.resetForm();
              state.setStep(state.batchMode ? 'batch-photos' : 'photo');
            }}
            onDone={() => window.close()}
          />
        )}
      </main>
    </div>
  );
};

export default PhotoCapture;
