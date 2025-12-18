import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IndustryTemplate } from '@/data/industryTemplates';
import { CreatedSupplier, CreatedArticle } from '../hooks/useQuestionOnboarding';
import { useCreateSupplier } from '@/hooks/useSuppliers';
import { useCreateCategory } from '@/hooks/useCategories';
import { useCreateUnit } from '@/hooks/useUnits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Package, Users, Tag, ArrowRight } from 'lucide-react';

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

  const createSupplier = useCreateSupplier();
  const createCategory = useCreateCategory();
  const createUnit = useCreateUnit();

  useEffect(() => {
    const saveData = async () => {
      try {
        // Get user's organization
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single();

        if (!profile?.organization_id) throw new Error('No organization found');

        // 1. Create categories (if importing)
        if (importCategories && industry.categories.length > 0) {
          for (const categoryName of industry.categories) {
            try {
              await createCategory.mutateAsync(categoryName);
              setSavedCategories((prev) => prev + 1);
            } catch (err) {
              // Ignore duplicate errors
              console.log('Category may already exist:', categoryName);
            }
          }
        }

        // 2. Create units (that don't exist)
        const { data: existingUnits } = await supabase
          .from('units')
          .select('name')
          .eq('organization_id', profile.organization_id);

        const existingUnitNames = new Set(existingUnits?.map((u) => u.name.toLowerCase()) || []);

        for (const unitName of industry.units) {
          if (!existingUnitNames.has(unitName.toLowerCase())) {
            try {
              await createUnit.mutateAsync(unitName);
            } catch (err) {
              console.log('Unit may already exist:', unitName);
            }
          }
        }

        // 3. Create suppliers and their articles
        for (const supplier of createdSuppliers) {
          try {
            const { data: newSupplier } = await supabase
              .from('suppliers')
              .insert({
                name: supplier.name,
                email: supplier.email || null,
                organization_id: profile.organization_id,
              })
              .select()
              .single();

            if (newSupplier) {
              setSavedSuppliers((prev) => prev + 1);

              // Create articles for this supplier
              const supplierArticles = createdArticles.filter(
                (a) => a.supplierName === supplier.name
              );

              for (const article of supplierArticles) {
                await supabase.from('articles').insert({
                  name: article.name,
                  unit: article.unit,
                  price: article.price || 0,
                  category: article.category || null,
                  supplier_id: newSupplier.id,
                  organization_id: profile.organization_id,
                });
                setSavedArticles((prev) => prev + 1);
              }
            }
          } catch (err) {
            console.error('Error creating supplier:', supplier.name, err);
          }
        }

        setIsComplete(true);
        toast.success('Alle Daten wurden erfolgreich gespeichert!');
      } catch (err) {
        console.error('Error saving onboarding data:', err);
        toast.error('Fehler beim Speichern der Daten');
      } finally {
        setIsSaving(false);
      }
    };

    saveData();
  }, []);

  const handleGoToCatalog = () => {
    navigate('/suppliers');
  };

  const handleGoToReports = () => {
    navigate('/reports');
  };

  return (
    <div className="space-y-8 max-w-xl mx-auto text-center">
      {isSaving ? (
        <>
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Daten werden gespeichert...</h2>
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
            <h2 className="text-2xl font-bold">Einrichtung abgeschlossen!</h2>
            <p className="text-muted-foreground">
              Ihr Katalog ist bereit. Sie können jetzt mit dem Bestellen beginnen.
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
            <Button variant="outline" onClick={handleGoToReports}>
              Zur Übersicht
            </Button>
            <Button onClick={handleGoToCatalog} className="gap-2">
              Zum Katalog
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
