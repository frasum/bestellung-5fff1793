import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndustryTemplate } from '@/data/industryTemplates';
import { CreatedSupplier, CreatedArticle } from '../hooks/useQuestionOnboarding';
import { ArrowLeft, ArrowRight, Package, Users, Trash2, Plus, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReviewStepProps {
  industry: IndustryTemplate;
  importCategories: boolean;
  createdSuppliers: CreatedSupplier[];
  createdArticles: CreatedArticle[];
  onRemoveSupplier: (index: number) => void;
  onRemoveArticle: (index: number) => void;
  onAddMoreSuppliers: () => void;
  onContinue: () => void;
  onBack: () => void;
}

export function ReviewStep({
  industry,
  importCategories,
  createdSuppliers,
  createdArticles,
  onRemoveSupplier,
  onRemoveArticle,
  onAddMoreSuppliers,
  onContinue,
  onBack,
}: ReviewStepProps) {
  const { terminology, categories } = industry;

  const getArticlesForSupplier = (supplierName: string) => {
    return createdArticles.filter((a) => a.supplierName === supplierName);
  };

  const isEmpty = createdSuppliers.length === 0;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Zusammenfassung</h2>
        <p className="text-muted-foreground">
          Überprüfen Sie Ihre Eingaben bevor sie gespeichert werden
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{createdSuppliers.length}</div>
            <div className="text-sm text-muted-foreground">{terminology.supplierPlural}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{createdArticles.length}</div>
            <div className="text-sm text-muted-foreground">{terminology.articlePlural}</div>
          </CardContent>
        </Card>
        {importCategories && (
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{categories.length}</div>
              <div className="text-sm text-muted-foreground">Kategorien</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-primary">{industry.units.length}</div>
            <div className="text-sm text-muted-foreground">Einheiten</div>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Noch keine {terminology.supplierPlural} hinzugefügt</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fügen Sie mindestens einen {terminology.supplier} hinzu, um fortzufahren
            </p>
            <Button onClick={onAddMoreSuppliers} className="gap-2">
              <Plus className="w-4 h-4" />
              {terminology.supplier} hinzufügen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suppliers & Articles */}
      {createdSuppliers.map((supplier, supplierIdx) => {
        const articles = getArticlesForSupplier(supplier.name);
        return (
          <Card key={supplierIdx}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {supplier.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveSupplier(supplierIdx)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {(supplier.email || supplier.customerNumber) && (
                <div className="flex gap-2 text-sm text-muted-foreground">
                  {supplier.email && <span>{supplier.email}</span>}
                  {supplier.customerNumber && <span>• #{supplier.customerNumber}</span>}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {articles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Keine {terminology.articlePlural} hinzugefügt
                </p>
              ) : (
                <div className="space-y-2">
                  {articles.map((article, articleIdx) => {
                    const globalIdx = createdArticles.findIndex(
                      (a) => a === article
                    );
                    return (
                      <div
                        key={articleIdx}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{article.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {article.unit}
                          </Badge>
                          {article.category && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Tag className="w-3 h-3" />
                              {article.category}
                            </Badge>
                          )}
                          {article.price && (
                            <span className="text-sm text-muted-foreground">
                              {article.price.toFixed(2)}€
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveArticle(globalIdx)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Categories to import */}
      {importCategories && categories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Kategorien (werden importiert)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  {cat}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        {!isEmpty && (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={onAddMoreSuppliers}
          >
            <Plus className="w-4 h-4" />
            Mehr hinzufügen
          </Button>
        )}
        <Button
          type="button"
          className="flex-1 gap-2"
          onClick={onContinue}
          disabled={isEmpty}
        >
          Daten speichern
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
