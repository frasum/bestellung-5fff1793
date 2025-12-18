import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { IndustryTemplate } from '@/data/industryTemplates';
import { ArrowRight, ArrowLeft, Package, Users, ListChecks } from 'lucide-react';

interface WelcomeStepProps {
  industry: IndustryTemplate;
  importCategories: boolean;
  onImportCategoriesChange: (value: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function WelcomeStep({
  industry,
  importCategories,
  onImportCategoriesChange,
  onContinue,
  onBack,
}: WelcomeStepProps) {
  const { terminology } = industry;

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          Los geht's mit Ihrem {industry.name}-Konto!
        </h2>
        <p className="text-muted-foreground">
          Wir helfen Ihnen, Ihre ersten {terminology.supplierPlural} und {terminology.articlePlural} anzulegen.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{terminology.supplierPlural} erstellen</h3>
            <p className="text-sm text-muted-foreground">
              Legen Sie Ihre {terminology.supplierPlural} an, von denen Sie regelmäßig bestellen
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{terminology.articlePlural} hinzufügen</h3>
            <p className="text-sm text-muted-foreground">
              Fügen Sie {terminology.articlePlural} zu jedem {terminology.supplier} hinzu
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ListChecks className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">Zusammenfassung prüfen</h3>
            <p className="text-sm text-muted-foreground">
              Überprüfen Sie alles und speichern Sie Ihre Daten
            </p>
          </div>
        </div>
      </div>

      {industry.categories.length > 0 && (
        <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="import-categories"
              checked={importCategories}
              onCheckedChange={(checked) => onImportCategoriesChange(checked === true)}
            />
            <Label htmlFor="import-categories" className="font-medium cursor-pointer">
              Standard-Kategorien für {industry.name} importieren
            </Label>
          </div>
          {importCategories && (
            <div className="flex flex-wrap gap-1 pl-6">
              {industry.categories.map((cat) => (
                <span
                  key={cat}
                  className="text-xs px-2 py-0.5 rounded-full bg-background border"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        <Button onClick={onContinue} className="flex-1 gap-2">
          Ersten {terminology.supplier} erstellen
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
