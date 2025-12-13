import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Check, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { PhotoCaptureAssignmentDialog } from './PhotoCaptureAssignmentDialog';

interface Article {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  category: string | null;
  supplier_id: string;
  image_url?: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface PhotoCaptureTabProps {
  articlesWithoutPhotos: Article[];
  suppliers: Supplier[];
  categories: Category[];
  organizationId: string;
  token: string;
  onPhotoAssigned: (articleId: string) => void;
  onBack: () => void;
}

export const PhotoCaptureTab = ({
  articlesWithoutPhotos,
  suppliers,
  categories,
  organizationId,
  token,
  onPhotoAssigned,
  onBack,
}: PhotoCaptureTabProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [captureArticle, setCaptureArticle] = useState<Article | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);

  // Filter articles by search and supplier
  const filteredArticles = useMemo(() => {
    let filtered = articlesWithoutPhotos;
    
    if (selectedSupplierId) {
      filtered = filtered.filter(a => a.supplier_id === selectedSupplierId);
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(searchLower) ||
        a.category?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [articlesWithoutPhotos, selectedSupplierId, search]);

  // Group by supplier for display
  const groupedBySupplier = useMemo(() => {
    const groups: Record<string, { supplier: Supplier; articles: Article[] }> = {};
    
    filteredArticles.forEach(article => {
      if (!groups[article.supplier_id]) {
        const supplier = suppliers.find(s => s.id === article.supplier_id);
        if (supplier) {
          groups[article.supplier_id] = { supplier, articles: [] };
        }
      }
      if (groups[article.supplier_id]) {
        groups[article.supplier_id].articles.push(article);
      }
    });
    
    return Object.values(groups);
  }, [filteredArticles, suppliers]);

  const totalArticles = articlesWithoutPhotos.length;
  const progressPercent = totalArticles > 0 ? (capturedCount / (capturedCount + totalArticles)) * 100 : 100;

  const handlePhotoComplete = (articleId: string) => {
    setCapturedCount(prev => prev + 1);
    onPhotoAssigned(articleId);
    setCaptureArticle(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground border-b border-primary-foreground/10">
        <div className="max-w-2xl mx-auto px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-11 w-11 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {t('photoCapture.title', 'Fotos erfassen')}
            </h1>
            <div className="w-11" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Progress */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {t('photoCapture.progress', 'Fortschritt')}
              </span>
              <span className="text-sm font-medium">
                {capturedCount} {t('photoCapture.of', 'von')} {capturedCount + totalArticles} ✓
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {totalArticles === 0 
                ? t('photoCapture.allDone', 'Alle Artikel haben Fotos!')
                : t('photoCapture.remaining', '{{count}} Artikel ohne Foto', { count: totalArticles })
              }
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('photoCapture.search', 'Artikel suchen...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Supplier Filter */}
        {suppliers.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedSupplierId === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSupplierId(null)}
              className="flex-shrink-0"
            >
              {t('common.all', 'Alle')} ({articlesWithoutPhotos.length})
            </Button>
            {suppliers.map(supplier => {
              const count = articlesWithoutPhotos.filter(a => a.supplier_id === supplier.id).length;
              if (count === 0) return null;
              return (
                <Button
                  key={supplier.id}
                  variant={selectedSupplierId === supplier.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSupplierId(supplier.id)}
                  className="flex-shrink-0"
                >
                  {supplier.name} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {/* Article List */}
        {groupedBySupplier.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">
                {t('photoCapture.noPending', 'Keine Artikel ohne Foto')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search 
                  ? t('photoCapture.noResults', 'Keine Treffer für die Suche')
                  : t('photoCapture.allComplete', 'Alle Artikel haben bereits Fotos')
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedBySupplier.map(({ supplier, articles }) => (
              <div key={supplier.id}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                  {supplier.name} ({articles.length})
                </h3>
                <div className="space-y-2">
                  {articles.map(article => (
                    <Card key={article.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{article.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              {article.category && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {article.category}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {article.unit}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setCaptureArticle(article)}
                            className="flex-shrink-0 h-10 gap-2"
                          >
                            <Camera className="h-4 w-4" />
                            {t('photoCapture.capture', 'Foto')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Capture Dialog */}
      {captureArticle && (
        <PhotoCaptureAssignmentDialog
          article={captureArticle}
          suppliers={suppliers}
          categories={categories}
          organizationId={organizationId}
          token={token}
          onComplete={handlePhotoComplete}
          onCancel={() => setCaptureArticle(null)}
        />
      )}
    </div>
  );
};
