import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { LogOut, Save, Search, Package, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  expiresAt: string;
}

interface Article {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  price: number;
  category: string | null;
  is_active: boolean;
}

const SupplierPortal = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<SupplierSession | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedArticles, setEditedArticles] = useState<Record<string, Partial<Article>>>({});

  useEffect(() => {
    const checkSession = () => {
      const storedSession = localStorage.getItem('supplierSession');
      if (!storedSession) {
        navigate('/supplier-login');
        return;
      }

      const parsed: SupplierSession = JSON.parse(storedSession);
      
      // Check if session expired
      if (new Date(parsed.expiresAt) < new Date()) {
        localStorage.removeItem('supplierSession');
        toast.error('Ihre Sitzung ist abgelaufen');
        navigate('/supplier-login');
        return;
      }

      setSession(parsed);
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    const fetchArticles = async () => {
      if (!session) return;

      try {
        const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
          },
        });

        if (error) throw error;
        setArticles(data?.articles || []);
      } catch (error: any) {
        console.error('Error fetching articles:', error);
        toast.error('Fehler beim Laden der Artikel');
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [session]);

  const handleLogout = () => {
    localStorage.removeItem('supplierSession');
    toast.success('Erfolgreich abgemeldet');
    navigate('/supplier-login');
  };

  const handleFieldChange = (articleId: string, field: keyof Article, value: any) => {
    setEditedArticles(prev => ({
      ...prev,
      [articleId]: {
        ...prev[articleId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (articleId: string) => {
    const changes = editedArticles[articleId];
    if (!changes || !session) return;

    setSaving(articleId);
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'update',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          articleId,
          changes,
        },
      });

      if (error) throw error;

      // Update local state
      setArticles(prev => prev.map(a => 
        a.id === articleId ? { ...a, ...changes } : a
      ));
      
      // Clear edited state for this article
      setEditedArticles(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });

      toast.success('Artikel gespeichert');
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(null);
    }
  };

  const getDisplayValue = (article: Article, field: keyof Article) => {
    if (editedArticles[article.id]?.[field] !== undefined) {
      return editedArticles[article.id][field];
    }
    return article[field];
  };

  const hasChanges = (articleId: string) => {
    return !!editedArticles[articleId] && Object.keys(editedArticles[articleId]).length > 0;
  };

  const filteredArticles = articles.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.sku && a.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.category && a.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="OrderFox.pro" className="h-10 w-10" />
            <div>
              <h1 className="font-semibold">Lieferantenportal</h1>
              <p className="text-sm text-muted-foreground">{session.supplierName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Meine Artikel
                </CardTitle>
                <CardDescription>
                  Bearbeiten Sie Ihre Artikeldaten direkt hier
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {articles.length} Artikel
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-6">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Artikel suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? 'Keine Artikel gefunden' : 'Noch keine Artikel vorhanden'}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Artikelname</TableHead>
                      <TableHead className="w-[120px]">SKU</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead className="w-[100px]">Einheit</TableHead>
                      <TableHead className="w-[120px]">Preis (€)</TableHead>
                      <TableHead className="w-[140px]">Kategorie</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArticles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <Input
                            value={getDisplayValue(article, 'name') as string}
                            onChange={(e) => handleFieldChange(article.id, 'name', e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={(getDisplayValue(article, 'sku') as string) || ''}
                            onChange={(e) => handleFieldChange(article.id, 'sku', e.target.value || null)}
                            className="h-8"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={(getDisplayValue(article, 'description') as string) || ''}
                            onChange={(e) => handleFieldChange(article.id, 'description', e.target.value || null)}
                            className="h-8"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={getDisplayValue(article, 'unit') as string}
                            onChange={(e) => handleFieldChange(article.id, 'unit', e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={getDisplayValue(article, 'price') as number}
                            onChange={(e) => handleFieldChange(article.id, 'price', parseFloat(e.target.value) || 0)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={(getDisplayValue(article, 'category') as string) || ''}
                            onChange={(e) => handleFieldChange(article.id, 'category', e.target.value || null)}
                            className="h-8"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleSave(article.id)}
                            disabled={!hasChanges(article.id) || saving === article.id}
                            className="w-full"
                          >
                            {saving === article.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Speichern
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SupplierPortal;
