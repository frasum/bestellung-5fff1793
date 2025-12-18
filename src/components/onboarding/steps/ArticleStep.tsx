import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IndustryTemplate } from '@/data/industryTemplates';
import { CreatedSupplier, CreatedArticle } from '../hooks/useQuestionOnboarding';
import { ArrowRight, ArrowLeft, Plus, Package, Scale, Euro, Tag, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ArticleStepProps {
  industry: IndustryTemplate;
  currentSupplier: CreatedSupplier | null;
  articlesForSupplier: CreatedArticle[];
  onAddArticle: (article: CreatedArticle) => void;
  onAddAnotherSupplier: () => void;
  onFinish: () => void;
  onBack: () => void;
}

export function ArticleStep({
  industry,
  currentSupplier,
  articlesForSupplier,
  onAddArticle,
  onAddAnotherSupplier,
  onFinish,
  onBack,
}: ArticleStepProps) {
  const { terminology, categories, units, exampleSuppliers } = industry;
  const [name, setName] = useState('');
  const [unit, setUnit] = useState(units[0] || 'Stück');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(categories[0] || '');
  const [error, setError] = useState('');

  if (!currentSupplier) {
    return null;
  }

  // Find example articles for this supplier
  const exampleSupplier = exampleSuppliers.find(
    (s) => s.name.toLowerCase() === currentSupplier.name.toLowerCase()
  );
  const exampleArticles = exampleSupplier?.articles || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(`Bitte geben Sie einen Namen für das ${terminology.article} ein`);
      return;
    }

    onAddArticle({
      name: name.trim(),
      unit,
      price: price ? parseFloat(price.replace(',', '.')) : undefined,
      category: category && category !== '__none__' ? category : undefined,
      supplierName: currentSupplier.name,
    });

    // Reset form for next article
    setName('');
    setPrice('');
  };

  const handleQuickAdd = (article: { name: string; unit: string; price: number; category: string }) => {
    onAddArticle({
      name: article.name,
      unit: article.unit,
      price: article.price,
      category: article.category,
      supplierName: currentSupplier.name,
    });
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="mb-2">
          {currentSupplier.name}
        </Badge>
        <h2 className="text-2xl font-bold">
          {terminology.articlePlural} hinzufügen
        </h2>
        <p className="text-muted-foreground">
          Welche {terminology.articlePlural} bestellen Sie von {currentSupplier.name}?
        </p>
      </div>

      {/* Added articles */}
      {articlesForSupplier.length > 0 && (
        <div className="p-4 rounded-lg border bg-muted/30 space-y-2">
          <Label className="text-sm">Bereits hinzugefügt ({articlesForSupplier.length}):</Label>
          <div className="flex flex-wrap gap-2">
            {articlesForSupplier.map((article, idx) => (
              <Badge key={idx} variant="outline" className="gap-1">
                <Package className="w-3 h-3" />
                {article.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick-Add Example Articles */}
      {exampleArticles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Schnellauswahl:</Label>
          <div className="flex flex-wrap gap-2">
            {exampleArticles.map((article) => {
              const alreadyAdded = articlesForSupplier.some(
                (a) => a.name.toLowerCase() === article.name.toLowerCase()
              );
              return (
                <Button
                  key={article.name}
                  type="button"
                  variant={alreadyAdded ? "secondary" : "outline"}
                  size="sm"
                  disabled={alreadyAdded}
                  className="gap-1"
                  onClick={() => handleQuickAdd(article)}
                >
                  {alreadyAdded ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  {article.name} ({article.unit})
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="article-name">{terminology.article}-Name *</Label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="article-name"
              placeholder={`z.B. ${exampleArticles[0]?.name || terminology.article}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="article-unit">Einheit</Label>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="pl-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-price">Preis (optional)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="article-price"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="article-category">Kategorie (optional)</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Keine Kategorie</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" variant="secondary" className="w-full gap-2">
          <Plus className="w-4 h-4" />
          {terminology.article} hinzufügen
        </Button>
      </form>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onAddAnotherSupplier}
        >
          Weiteren {terminology.supplier} hinzufügen
        </Button>
        <Button type="button" className="flex-1 gap-2" onClick={onFinish}>
          Fertig
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
