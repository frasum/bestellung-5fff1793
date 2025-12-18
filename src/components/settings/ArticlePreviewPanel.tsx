import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SupplierOrderUnitSelect } from '@/components/suppliers/SupplierOrderUnitSelect';
import { Smartphone, Mail, CheckCircle, ChevronLeft, ChevronRight, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useOrderUnits } from '@/hooks/useOrderUnits';
import { useBulkUpdateArticles } from '@/hooks/useArticles';
import { toast } from 'sonner';

interface Article {
  id: string;
  name: string;
  category: string | null;
  top_category: string | null;
  order_unit_id: string | null;
  supplier_id: string;
  suppliers?: { id: string; name: string } | null;
  unit: string;
  price: number;
  packaging_unit: number | null;
}

interface ArticlePreviewPanelProps {
  articles: Article[];
  onArticleUpdate: () => void;
}

export function ArticlePreviewPanel({ articles, onArticleUpdate }: ArticlePreviewPanelProps) {
  const { t } = useTranslation();
  const { data: orderUnits = [] } = useOrderUnits();
  const bulkUpdate = useBulkUpdateArticles();
  
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showOnlyProblematic, setShowOnlyProblematic] = useState(false);
  
  // Correction state
  const [editOrderUnitId, setEditOrderUnitId] = useState<string | null>(null);
  const [editPackagingUnit, setEditPackagingUnit] = useState<string>('');
  
  // Filter articles for dropdown
  const displayArticles = useMemo(() => {
    if (showOnlyProblematic) {
      return articles.filter(a => !a.order_unit_id);
    }
    return articles;
  }, [articles, showOnlyProblematic]);
  
  // Problematic count
  const problematicCount = useMemo(() => 
    articles.filter(a => !a.order_unit_id).length
  , [articles]);
  
  // Selected article
  const selectedArticle = useMemo(() => 
    articles.find(a => a.id === selectedArticleId) || null
  , [articles, selectedArticleId]);
  
  // Get order unit display name
  const getOrderUnitName = (unitId: string | null) => {
    if (!unitId) return null;
    const unit = orderUnits.find(u => u.id === unitId);
    return unit?.name || null;
  };
  
  // Update edit state when article changes
  const handleArticleSelect = (articleId: string) => {
    setSelectedArticleId(articleId);
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setEditOrderUnitId(article.order_unit_id);
      setEditPackagingUnit(article.packaging_unit?.toString() || '');
    }
  };
  
  // Navigate to next/previous problematic article
  const navigateProblematic = (direction: 'prev' | 'next') => {
    const problematicArticles = articles.filter(a => !a.order_unit_id);
    if (problematicArticles.length === 0) return;
    
    const currentIndex = problematicArticles.findIndex(a => a.id === selectedArticleId);
    let newIndex: number;
    
    if (currentIndex === -1) {
      newIndex = 0;
    } else if (direction === 'next') {
      newIndex = (currentIndex + 1) % problematicArticles.length;
    } else {
      newIndex = currentIndex === 0 ? problematicArticles.length - 1 : currentIndex - 1;
    }
    
    handleArticleSelect(problematicArticles[newIndex].id);
  };
  
  // Save changes
  const handleSave = async () => {
    if (!selectedArticle) return;
    
    const updates: Record<string, any> = {};
    if (editOrderUnitId !== selectedArticle.order_unit_id) {
      updates.order_unit_id = editOrderUnitId;
    }
    const newPackaging = editPackagingUnit ? parseInt(editPackagingUnit) : null;
    if (newPackaging !== selectedArticle.packaging_unit) {
      updates.packaging_unit = newPackaging;
    }
    
    if (Object.keys(updates).length === 0) {
      toast.info('Keine Änderungen');
      return;
    }
    
    bulkUpdate.mutate(
      { ids: [selectedArticle.id], updates: updates as any },
      {
        onSuccess: () => {
          toast.success('Artikel aktualisiert');
          onArticleUpdate();
        },
      }
    );
  };
  
  // Get status color
  const getStatusBadge = (hasOrderUnit: boolean) => {
    if (hasOrderUnit) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Korrekt
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-400 dark:border-yellow-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Fallback
      </Badge>
    );
  };
  
  // Preview what will be displayed
  const getDisplayUnit = () => {
    if (!selectedArticle) return '—';
    const orderUnitName = getOrderUnitName(editOrderUnitId);
    return orderUnitName || selectedArticle.unit;
  };
  
  const willUseFallback = !editOrderUnitId;
  
  return (
    <div className="space-y-4">
      {/* Article Selection */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Artikel auswählen</Label>
          <Select 
            value={selectedArticleId || ''} 
            onValueChange={handleArticleSelect}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Artikel wählen..." />
            </SelectTrigger>
            <SelectContent>
              {displayArticles.map(article => (
                <SelectItem key={article.id} value={article.id}>
                  <span className="flex items-center gap-2">
                    {!article.order_unit_id && (
                      <AlertCircle className="h-3 w-3 text-yellow-500" />
                    )}
                    {article.name}
                    <span className="text-muted-foreground text-xs">({article.suppliers?.name})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOnlyProblematic(!showOnlyProblematic)}
            className={showOnlyProblematic ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50' : ''}
          >
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
            Nur Probleme ({problematicCount})
          </Button>
          
          {problematicCount > 0 && (
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateProblematic('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateProblematic('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {selectedArticle ? (
        <>
          {/* Preview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* EasyOrder Preview */}
            <Card className="border-2">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  EasyOrder
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm">{selectedArticle.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded">−</span>
                      <span className="font-semibold text-foreground text-base mx-2">3</span>
                      <span className="bg-muted px-2 py-0.5 rounded">+</span>
                    </div>
                    <span className={`text-sm font-medium ${willUseFallback ? 'text-yellow-600' : 'text-green-600'}`}>
                      {getDisplayUnit()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  {getStatusBadge(!willUseFallback)}
                </div>
              </CardContent>
            </Card>
            
            {/* Supplier Email Preview */}
            <Card className="border-2">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Lieferanten-E-Mail
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="bg-muted/50 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted">
                        <th className="text-left p-2 font-medium">Artikel</th>
                        <th className="text-center p-2 font-medium">Menge</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-2">{selectedArticle.name}</td>
                        <td className={`p-2 text-center font-semibold ${willUseFallback ? 'text-yellow-600' : 'text-green-600'}`}>
                          3× {getDisplayUnit()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 flex justify-end">
                  {getStatusBadge(!willUseFallback)}
                </div>
              </CardContent>
            </Card>
            
            {/* Confirmation Email Preview */}
            <Card className="border-2">
              <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Bestätigung
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Bestellung bestätigt</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">{selectedArticle.name}:</span>
                    <span className={`ml-1 font-medium ${willUseFallback ? 'text-yellow-600' : 'text-green-600'}`}>
                      3× {getDisplayUnit()}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  {getStatusBadge(!willUseFallback)}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Correction Area */}
          <Card className="bg-muted/30">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Korrektur</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">Bestelleinheit</Label>
                  <SupplierOrderUnitSelect
                    value={editOrderUnitId}
                    onChange={setEditOrderUnitId}
                  />
                </div>
                <div className="w-32 space-y-1.5">
                  <Label className="text-xs">Stk/BE</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="z.B. 6"
                    value={editPackagingUnit}
                    onChange={(e) => setEditPackagingUnit(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSave}
                  disabled={bulkUpdate.isPending}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Speichern
                </Button>
              </div>
              
              {willUseFallback && (
                <p className="text-xs text-yellow-600 mt-3 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Ohne Bestelleinheit wird "{selectedArticle.unit}" als Fallback angezeigt
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Wählen Sie einen Artikel, um die Vorschau zu sehen</p>
        </div>
      )}
    </div>
  );
}
