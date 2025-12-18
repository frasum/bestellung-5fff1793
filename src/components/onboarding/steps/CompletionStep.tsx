import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IndustryTemplate } from '@/data/industryTemplates';
import { CreatedSupplier, CreatedArticle } from '../hooks/useQuestionOnboarding';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Package, Users, Tag, ArrowRight, RotateCcw } from 'lucide-react';

interface CompletionStepProps {
  industry: IndustryTemplate;
  importCategories: boolean;
  createdSuppliers: CreatedSupplier[];
  createdArticles: CreatedArticle[];
}

export function CompletionStep({
  industry,
  importCategories,
  createdSuppliers,
  createdArticles,
}: CompletionStepProps) {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(true);
  const [savedSuppliers, setSavedSuppliers] = useState(0);
  const [savedArticles, setSavedArticles] = useState(0);
  const [savedCategories, setSavedCategories] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Pure simulation - no database operations
    const simulateSaving = async () => {
      try {
        // 1. Simulate saving categories
        if (importCategories && industry.categories.length > 0) {
          for (let i = 0; i < industry.categories.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 80));
            setSavedCategories(prev => prev + 1);
          }
        }

        // 2. Simulate saving suppliers and their articles
        for (const supplier of createdSuppliers) {
          await new Promise(resolve => setTimeout(resolve, 150));
          setSavedSuppliers(prev => prev + 1);

          // Simulate saving articles for this supplier
          const supplierArticles = createdArticles.filter(
            a => a.supplierName === supplier.name
          );

          for (const _article of supplierArticles) {
            await new Promise(resolve => setTimeout(resolve, 60));
            setSavedArticles(prev => prev + 1);
          }
        }

        setIsComplete(true);
        toast.success('Demo abgeschlossen! (Simulation - keine Daten gespeichert)');
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setIsSaving(false);
      }
    };

    simulateSaving();
  }, [createdSuppliers, createdArticles, importCategories, industry.categories]);

  const handleRestartDemo = () => {
    navigate('/onboarding/questions');
    window.location.reload();
  };

  const handleGoToPresentation = () => {
    navigate('/');
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto text-center">
      {isSaving ? (
        <>
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Einrichtung wird simuliert...</h2>
            <p className="text-muted-foreground">Bitte warten Sie einen Moment</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{savedSuppliers}</div>
                <div className="text-sm text-muted-foreground">
                  {industry.terminology.supplierPlural}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{savedArticles}</div>
                <div className="text-sm text-muted-foreground">
                  {industry.terminology.articlePlural}
                </div>
              </CardContent>
            </Card>
            {importCategories && (
              <Card>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{savedCategories}</div>
                  <div className="text-sm text-muted-foreground">Kategorien</div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Demo abgeschlossen!</h2>
            <p className="text-muted-foreground">
              So einfach ist die Einrichtung für Ihre Kunden.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <Users className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <div className="text-2xl font-bold">{savedSuppliers}</div>
                <div className="text-sm text-muted-foreground">
                  {industry.terminology.supplierPlural}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <Package className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <div className="text-2xl font-bold">{savedArticles}</div>
                <div className="text-sm text-muted-foreground">
                  {industry.terminology.articlePlural}
                </div>
              </CardContent>
            </Card>
            {importCategories && (
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="pt-4">
                  <Tag className="w-6 h-6 mx-auto mb-2 text-green-600 dark:text-green-400" />
                  <div className="text-2xl font-bold">{savedCategories}</div>
                  <div className="text-sm text-muted-foreground">Kategorien</div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-3 justify-center pt-4">
            <Button variant="outline" onClick={handleRestartDemo} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Demo neu starten
            </Button>
            <Button onClick={handleGoToPresentation} className="gap-2">
              Zur Startseite
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
