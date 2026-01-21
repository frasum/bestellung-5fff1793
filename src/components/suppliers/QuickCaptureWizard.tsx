import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VoiceInventoryResults } from './VoiceInventoryResults';
import { MobileQRCodeOption } from './MobileQRCodeOption';
import {
  QuickCaptureWizardProps,
  useQuickCaptureState,
  CaptureStep,
  ArticleStep,
  SupplierStep,
  ConfirmStep,
  WizardProgress,
} from './quick-capture';

export const QuickCaptureWizard = (props: QuickCaptureWizardProps) => {
  const { t } = useTranslation();
  const { open, onOpenChange, suppliers, categories, units } = props;
  const state = useQuickCaptureState(props);

  const handleClose = () => {
    state.resetWizard();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {t('quickCapture.title', 'Schnell-Erfassung')}
          </DialogTitle>
        </DialogHeader>

        <WizardProgress currentStep={state.step} />

        {state.step === 'capture' && (
          <CaptureStep
            captureMode={state.captureMode}
            onCaptureModeChange={state.setCaptureMode}
            previewImage={state.previewImage}
            isAnalyzing={state.isAnalyzing}
            onClearPreview={() => { state.setPreviewImage(null); state.setIdentificationResult(null); }}
            onCameraClick={() => state.cameraInputRef.current?.click()}
            onUploadClick={() => state.fileInputRef.current?.click()}
            onVoiceResult={state.handleVoiceResult}
            fileInputRef={state.fileInputRef}
            cameraInputRef={state.cameraInputRef}
            onFileSelect={state.handleFileSelect}
          />
        )}

        {state.step === 'voice-results' && (
          <VoiceInventoryResults
            transcript={state.voiceTranscript}
            articles={state.voiceArticles}
            categories={categories}
            units={units}
            onConfirm={state.handleVoiceArticlesConfirm}
            onRetry={() => state.setStep('capture')}
          />
        )}

        {state.step === 'qr' && (
          <MobileQRCodeOption onBack={() => state.setStep('capture')} />
        )}

        {state.step === 'article' && (
          <ArticleStep
            queueLength={state.voiceArticleQueue.length}
            currentQueueIndex={state.currentQueueIndex}
            createdArticlesCount={state.createdArticlesCount}
            previewImage={state.previewImage}
            identificationResult={state.identificationResult}
            articleName={state.articleName}
            onArticleNameChange={state.setArticleName}
            articleDescription={state.articleDescription}
            onArticleDescriptionChange={state.setArticleDescription}
            articleCategory={state.articleCategory}
            onArticleCategoryChange={state.setArticleCategory}
            articleUnit={state.articleUnit}
            onArticleUnitChange={state.setArticleUnit}
            articlePrice={state.articlePrice}
            onArticlePriceChange={state.setArticlePrice}
            articleSku={state.articleSku}
            onArticleSkuChange={state.setArticleSku}
            categories={categories}
            units={units}
            onBack={() => state.setStep('capture')}
            onNext={() => state.setStep('supplier')}
            canProceed={!!state.canProceedToSupplier}
          />
        )}

        {state.step === 'supplier' && (
          <SupplierStep
            queueLength={state.voiceArticleQueue.length}
            currentQueueIndex={state.currentQueueIndex}
            supplierMode={state.supplierMode}
            onSupplierModeChange={state.setSupplierMode}
            selectedSupplierId={state.selectedSupplierId}
            onSelectedSupplierChange={state.setSelectedSupplierId}
            supplierSearch={state.supplierSearch}
            onSupplierSearchChange={state.setSupplierSearch}
            filteredSuppliers={state.filteredSuppliers}
            allSuppliers={suppliers}
            newSupplierName={state.newSupplierName}
            onNewSupplierNameChange={state.setNewSupplierName}
            newSupplierEmail={state.newSupplierEmail}
            onNewSupplierEmailChange={state.setNewSupplierEmail}
            newSupplierPhone={state.newSupplierPhone}
            onNewSupplierPhoneChange={state.setNewSupplierPhone}
            newSupplierCustomerNumber={state.newSupplierCustomerNumber}
            onNewSupplierCustomerNumberChange={state.setNewSupplierCustomerNumber}
            onBack={() => state.setStep('article')}
            onSave={state.handleFinalSave}
            onSaveAndContinue={state.handleSaveAndContinue}
            canSave={!!state.canSave}
            isSaving={state.isSaving}
          />
        )}

        {state.step === 'confirm' && (
          <ConfirmStep
            articleName={state.articleName}
            createdArticlesCount={state.createdArticlesCount}
            onCaptureNext={() => { state.resetWizard(); state.setStep('capture'); }}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
