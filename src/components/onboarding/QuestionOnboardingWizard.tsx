import { Progress } from '@/components/ui/progress';
import { useQuestionOnboarding } from './hooks/useQuestionOnboarding';
import { IndustrySelectStep } from './steps/IndustrySelectStep';
import { WelcomeStep } from './steps/WelcomeStep';
import { SupplierStep } from './steps/SupplierStep';
import { ArticleStep } from './steps/ArticleStep';
import { ReviewStep } from './steps/ReviewStep';
import { CompletionStep } from './steps/CompletionStep';

export function QuestionOnboardingWizard() {
  const {
    currentStep,
    selectedIndustry,
    importCategories,
    createdSuppliers,
    createdArticles,
    currentSupplier,
    selectIndustry,
    setImportCategories,
    goToStep,
    nextStep,
    prevStep,
    addSupplier,
    removeSupplier,
    setCurrentSupplier,
    addArticle,
    removeArticle,
    getArticlesForSupplier,
    getProgress,
  } = useQuestionOnboarding();

  const renderStep = () => {
    switch (currentStep) {
      case 'industry':
        return (
          <IndustrySelectStep
            selectedIndustry={selectedIndustry}
            onSelectIndustry={selectIndustry}
            onContinue={nextStep}
          />
        );

      case 'welcome':
        if (!selectedIndustry) {
          goToStep('industry');
          return null;
        }
        return (
          <WelcomeStep
            industry={selectedIndustry}
            importCategories={importCategories}
            onImportCategoriesChange={setImportCategories}
            onContinue={nextStep}
            onBack={prevStep}
          />
        );

      case 'supplier':
        if (!selectedIndustry) {
          goToStep('industry');
          return null;
        }
        return (
          <SupplierStep
            industry={selectedIndustry}
            createdSuppliers={createdSuppliers}
            onAddSupplier={(supplier) => {
              addSupplier(supplier);
            }}
            onContinue={nextStep}
            onBack={prevStep}
            onSkip={() => goToStep('review')}
          />
        );

      case 'articles':
        if (!selectedIndustry || !currentSupplier) {
          if (createdSuppliers.length > 0) {
            setCurrentSupplier(createdSuppliers[createdSuppliers.length - 1]);
          } else {
            goToStep('supplier');
          }
          return null;
        }
        return (
          <ArticleStep
            industry={selectedIndustry}
            currentSupplier={currentSupplier}
            articlesForSupplier={getArticlesForSupplier(currentSupplier.name)}
            onAddArticle={addArticle}
            onAddAnotherSupplier={() => goToStep('supplier')}
            onFinish={() => goToStep('review')}
            onBack={prevStep}
          />
        );

      case 'review':
        if (!selectedIndustry) {
          goToStep('industry');
          return null;
        }
        return (
          <ReviewStep
            industry={selectedIndustry}
            importCategories={importCategories}
            createdSuppliers={createdSuppliers}
            createdArticles={createdArticles}
            onRemoveSupplier={removeSupplier}
            onRemoveArticle={removeArticle}
            onAddMoreSuppliers={() => goToStep('supplier')}
            onContinue={nextStep}
            onBack={() => {
              if (createdSuppliers.length > 0) {
                setCurrentSupplier(createdSuppliers[createdSuppliers.length - 1]);
                goToStep('articles');
              } else {
                goToStep('supplier');
              }
            }}
          />
        );

      case 'completion':
        if (!selectedIndustry) {
          goToStep('industry');
          return null;
        }
        return (
          <CompletionStep
            industry={selectedIndustry}
            importCategories={importCategories}
            createdSuppliers={createdSuppliers}
            createdArticles={createdArticles}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with progress */}
        <div className="mb-8 space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Einrichtungs-Assistent</h1>
            <p className="text-muted-foreground mt-1">
              Richten Sie Ihren Katalog in wenigen Schritten ein
            </p>
          </div>
          
          {currentStep !== 'completion' && (
            <div className="space-y-2">
              <Progress value={getProgress()} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Branche</span>
                <span>Willkommen</span>
                <span>Lieferanten</span>
                <span>Artikel</span>
                <span>Prüfen</span>
                <span>Fertig</span>
              </div>
            </div>
          )}
        </div>

        {/* Step Content */}
        <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
