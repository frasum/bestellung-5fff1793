import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { format, differenceInHours } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LogOut, Save, Search, Package, Loader2, Clock, Plus, FileDown, AlertCircle, AlertTriangle, SendHorizontal } from 'lucide-react';
import logo from '@/assets/logo.png';
import { SupplierArticleCard } from '@/components/suppliers/SupplierArticleCard';
import { SupplierUnitSelect } from '@/components/suppliers/SupplierUnitSelect';
import { SupplierCategorySelect } from '@/components/suppliers/SupplierCategorySelect';
import { SuggestArticleDialog } from '@/components/suppliers/SuggestArticleDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Unit {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}
interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
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
  annual_order_value: number | null;
}

interface PendingChange {
  id: string;
  article_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  status: string;
  created_at: string;
}

interface PortalSettings {
  portal_title: string;
  welcome_message: string | null;
  card_title: string;
  card_description: string;
  info_text: string | null;
  footer_text: string | null;
  logo_url: string | null;
}

interface DraftData {
  editedArticles: Record<string, Partial<Article>>;
  priceInputs: Record<string, string>;
  annualOrderValueInputs: Record<string, string>;
}

const SupplierPortal = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<SupplierSession | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedArticles, setEditedArticles] = useState<Record<string, Partial<Article>>>({});
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [annualOrderValueInputs, setAnnualOrderValueInputs] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [portalSettings, setPortalSettings] = useState<PortalSettings>({
    portal_title: 'Lieferantenportal',
    welcome_message: null,
    card_title: 'Meine Artikel',
    card_description: 'Änderungen werden zur Genehmigung eingereicht.',
    info_text: null,
    footer_text: null,
    logo_url: null,
  });

  useEffect(() => {
    const checkSession = () => {
      const storedSession = localStorage.getItem('supplierSession');
      if (!storedSession) {
        navigate('/supplier-login');
        return;
      }

      const parsed: SupplierSession = JSON.parse(storedSession);
      
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
    const fetchData = async () => {
      if (!session) return;

      try {
        // Fetch portal settings first
        const { data: settingsData, error: settingsError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-settings',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!settingsError && settingsData?.settings) {
          setPortalSettings(settingsData.settings);
        }

        // Fetch units
        const { data: unitsData, error: unitsError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-units',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!unitsError && unitsData?.units) {
          setUnits(unitsData.units);
        }

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-categories',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!categoriesError && categoriesData?.categories) {
          setCategories(categoriesData.categories);
        }

        // Fetch articles
        const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (error) throw error;
        setArticles(data?.articles || []);
        setPendingChanges(data?.pendingChanges || []);

        // Fetch draft if exists
        const { data: draftData, error: draftError } = await supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'get-draft',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        });

        if (!draftError && draftData?.draft) {
          const draft = draftData.draft as DraftData;
          setEditedArticles(draft.editedArticles || {});
          setPriceInputs(draft.priceInputs || {});
          setAnnualOrderValueInputs(draft.annualOrderValueInputs || {});
          setHasDraft(true);
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const handleSaveDraft = async () => {
    if (!session) return;
    
    setSavingDraft(true);
    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'save-draft',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          draftData: {
            editedArticles,
            priceInputs,
            annualOrderValueInputs,
          },
        },
      });

      if (error) throw error;
      setHasDraft(true);
      toast.success('Entwurf gespeichert');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error('Fehler beim Speichern des Entwurfs');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!session) return;
    
    try {
      await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'delete-draft',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
        },
      });
      setHasDraft(false);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const handleSave = async (articleId: string) => {
    const changes = { ...editedArticles[articleId] };
    if (!session) return;
    
    // Parse price from input string if it was edited
    if (priceInputs[articleId] !== undefined) {
      const priceValue = priceInputs[articleId].replace(',', '.');
      const parsed = parseFloat(priceValue);
      if (!isNaN(parsed)) {
        changes.price = parsed;
      }
    }

    // Parse annual_order_value from input string if it was edited
    if (annualOrderValueInputs[articleId] !== undefined) {
      const aoValue = annualOrderValueInputs[articleId].replace(',', '.');
      const parsed = parseFloat(aoValue);
      if (!isNaN(parsed)) {
        changes.annual_order_value = parsed;
      } else if (annualOrderValueInputs[articleId] === '') {
        changes.annual_order_value = null;
      }
    }
    
    if (!changes || Object.keys(changes).length === 0) return;

    setSaving(articleId);
    try {
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'update',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleId,
          changes,
        },
      });

      if (error) throw error;

      if (data?.pendingChanges) {
        setPendingChanges(prev => [...prev, ...data.pendingChanges]);
      }
      
      // Clear edited state for this article
      setEditedArticles(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });
      setPriceInputs(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });
      setAnnualOrderValueInputs(prev => {
        const newState = { ...prev };
        delete newState[articleId];
        return newState;
      });

      // Delete draft after successful submission if it exists
      if (hasDraft) {
        await handleDeleteDraft();
      }

      toast.success('Änderungen zur Genehmigung eingereicht');
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
    const hasFieldChanges = !!editedArticles[articleId] && Object.keys(editedArticles[articleId]).length > 0;
    const hasPriceChange = priceInputs[articleId] !== undefined;
    const hasAOVChange = annualOrderValueInputs[articleId] !== undefined;
    return hasFieldChanges || hasPriceChange || hasAOVChange;
  };

  const hasAnyChanges = () => {
    return Object.keys(editedArticles).length > 0 || 
           Object.keys(priceInputs).length > 0 || 
           Object.keys(annualOrderValueInputs).length > 0;
  };

  const getChangedArticleCount = () => {
    const changedIds = new Set([
      ...Object.keys(editedArticles),
      ...Object.keys(priceInputs),
      ...Object.keys(annualOrderValueInputs),
    ]);
    return changedIds.size;
  };

  const handleSaveAll = async () => {
    if (!session || !hasAnyChanges()) return;

    setSavingAll(true);
    try {
      // Collect all article IDs with changes
      const changedIds = new Set([
        ...Object.keys(editedArticles),
        ...Object.keys(priceInputs),
        ...Object.keys(annualOrderValueInputs),
      ]);

      // Build the changes array for each article
      const articleChanges: Array<{ articleId: string; changes: Record<string, any> }> = [];
      
      for (const articleId of changedIds) {
        const changes: Record<string, any> = { ...editedArticles[articleId] };
        
        // Parse price from input string if it was edited
        if (priceInputs[articleId] !== undefined) {
          const priceValue = priceInputs[articleId].replace(',', '.');
          const parsed = parseFloat(priceValue);
          if (!isNaN(parsed)) {
            changes.price = parsed;
          }
        }

        // Parse annual_order_value from input string if it was edited
        if (annualOrderValueInputs[articleId] !== undefined) {
          const aoValue = annualOrderValueInputs[articleId].replace(',', '.');
          const parsed = parseFloat(aoValue);
          if (!isNaN(parsed)) {
            changes.annual_order_value = parsed;
          } else if (annualOrderValueInputs[articleId] === '') {
            changes.annual_order_value = null;
          }
        }

        if (Object.keys(changes).length > 0) {
          articleChanges.push({ articleId, changes });
        }
      }

      if (articleChanges.length === 0) {
        toast.info('Keine Änderungen zum Einreichen');
        return;
      }

      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'update-all',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleChanges,
        },
      });

      if (error) throw error;

      if (data?.pendingChanges) {
        setPendingChanges(prev => [...prev, ...data.pendingChanges]);
      }

      // Clear all edited states
      setEditedArticles({});
      setPriceInputs({});
      setAnnualOrderValueInputs({});

      // Delete draft after successful submission
      if (hasDraft) {
        await handleDeleteDraft();
      }

      const changeCount = data?.pendingChanges?.length || articleChanges.length;
      toast.success(`${changeCount} Änderung${changeCount > 1 ? 'en' : ''} zur Genehmigung eingereicht`);
    } catch (error: any) {
      console.error('Error saving all articles:', error);
      toast.error('Fehler beim Einreichen der Änderungen');
    } finally {
      setSavingAll(false);
    }
  };

  const getPendingChangesForArticle = (articleId: string) => {
    return pendingChanges.filter(c => c.article_id === articleId && c.status === 'pending');
  };

  const getPendingChangeForField = (articleId: string, fieldName: string) => {
    return pendingChanges.find(
      c => c.article_id === articleId && c.field_name === fieldName && c.status === 'pending'
    );
  };

  const hasPendingChange = (articleId: string, fieldName: string) => {
    return !!getPendingChangeForField(articleId, fieldName);
  };

  const handleCreateUnit = async (unitName: string) => {
    if (!session) return;
    
    const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
      body: {
        action: 'create-unit',
        supplierId: session.supplierId,
        organizationId: session.organizationId,
        sessionToken: session.sessionToken,
        unitName,
      },
    });

    if (error) {
      toast.error('Fehler beim Erstellen der Einheit');
      throw error;
    }

    if (data?.unit) {
      setUnits(prev => {
        if (prev.some(u => u.id === data.unit.id)) {
          return prev;
        }
        return [...prev, data.unit].sort((a, b) => a.name.localeCompare(b.name, 'de'));
      });
      toast.success(`Einheit "${unitName}" hinzugefügt`);
    }
  };

  const handleCreateCategory = async (categoryName: string) => {
    if (!session) return;
    
    const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
      body: {
        action: 'create-category',
        supplierId: session.supplierId,
        organizationId: session.organizationId,
        sessionToken: session.sessionToken,
        categoryName,
      },
    });

    if (error) {
      toast.error('Fehler beim Erstellen der Kategorie');
      throw error;
    }

    if (data?.category) {
      setCategories(prev => {
        if (prev.some(c => c.id === data.category.id)) {
          return prev;
        }
        return [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name, 'de'));
      });
      toast.success(`Kategorie "${categoryName}" hinzugefügt`);
    }
  };

  const handleSuggestArticle = async (article: {
    name: string;
    sku: string | null;
    description: string | null;
    unit: string;
    price: number;
    category: string | null;
    comment: string | null;
  }) => {
    if (!session) return;

    const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
      body: {
        action: 'suggest-article',
        supplierId: session.supplierId,
        organizationId: session.organizationId,
        sessionToken: session.sessionToken,
        suggestedArticle: article,
      },
    });

    if (error) {
      toast.error('Fehler beim Einreichen des Vorschlags');
      throw error;
    }

    toast.success('Artikelvorschlag zur Genehmigung eingereicht');
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
            <img 
              src={portalSettings.logo_url || logo} 
              alt="Portal Logo" 
              className={portalSettings.logo_url ? "h-10 max-w-[120px] object-contain" : "h-10 w-10"} 
            />
            <div>
              <h1 className="font-semibold">{portalSettings.portal_title}</h1>
              <p className="text-sm text-muted-foreground">{session.supplierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Expiry display */}
            {session.expiresAt && (
              <div className="hidden sm:flex items-center gap-2">
                {differenceInHours(new Date(session.expiresAt), new Date()) <= 24 ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Läuft bald ab
                  </Badge>
                ) : null}
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Zugang bis: {format(new Date(session.expiresAt), 'dd.MM.yyyy', { locale: de })}
                </div>
              </div>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Draft Alert */}
        {hasDraft && (
          <Alert className="mb-6 border-primary/50 bg-primary/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Sie haben einen gespeicherten Entwurf. Ihre letzten Änderungen wurden wiederhergestellt.</span>
              <Button variant="ghost" size="sm" onClick={handleDeleteDraft}>
                Entwurf verwerfen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome Message */}
        {portalSettings.welcome_message && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {portalSettings.welcome_message}
            </ReactMarkdown>
          </div>
        )}

        {/* Info Text */}
        {portalSettings.info_text && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {portalSettings.info_text}
            </ReactMarkdown>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  {portalSettings.card_title}
                </CardTitle>
                <CardDescription>
                  {portalSettings.card_description}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                {pendingChanges.filter(c => c.status === 'pending').length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {pendingChanges.filter(c => c.status === 'pending').length} ausstehend
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {articles.length} Artikel
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Action Buttons */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Artikel suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft} 
                  disabled={!hasAnyChanges() || savingDraft || savingAll}
                >
                  {savingDraft ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Entwurf speichern
                </Button>
                <Button 
                  onClick={handleSaveAll} 
                  disabled={!hasAnyChanges() || savingAll || savingDraft}
                  className="bg-primary"
                >
                  {savingAll ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <SendHorizontal className="h-4 w-4 mr-2" />
                  )}
                  Alle einreichen {hasAnyChanges() && `(${getChangedArticleCount()})`}
                </Button>
                <Button onClick={() => setSuggestDialogOpen(true)} className="shrink-0" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Neuen Artikel vorschlagen
                </Button>
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
              <>
                {/* Desktop: Table */}
                <div className="hidden lg:block border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[280px]">Artikelname</TableHead>
                        <TableHead className="w-[100px]">SKU</TableHead>
                        <TableHead className="min-w-[150px]">Beschreibung</TableHead>
                        <TableHead className="w-[80px]">Einheit</TableHead>
                        <TableHead className="w-[100px]">Preis (€)</TableHead>
                        <TableHead className="w-[120px]">Bestellwert (365T)</TableHead>
                        <TableHead className="w-[120px]">Kategorie</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((article) => {
                        return (
                          <TableRow key={article.id}>
                            <TableCell>
                              <span className="font-medium">{article.name}</span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  value={(getDisplayValue(article, 'sku') as string) || ''}
                                  onChange={(e) => handleFieldChange(article.id, 'sku', e.target.value || null)}
                                  className={`h-8 ${hasPendingChange(article.id, 'sku') ? 'border-amber-500' : ''}`}
                                  placeholder="-"
                                />
                                {getPendingChangeForField(article.id, 'sku') && (
                                  <div className="text-xs">
                                    <span className="text-amber-600">Ausstehend</span>
                                    <span className="text-muted-foreground ml-1">
                                      (vorher: {getPendingChangeForField(article.id, 'sku')?.old_value || '-'})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  value={(getDisplayValue(article, 'description') as string) || ''}
                                  onChange={(e) => handleFieldChange(article.id, 'description', e.target.value || null)}
                                  className={`h-8 ${hasPendingChange(article.id, 'description') ? 'border-amber-500' : ''}`}
                                  placeholder="-"
                                />
                                {getPendingChangeForField(article.id, 'description') && (
                                  <div className="text-xs">
                                    <span className="text-amber-600">Ausstehend</span>
                                    <span className="text-muted-foreground ml-1">
                                      (vorher: {getPendingChangeForField(article.id, 'description')?.old_value || '-'})
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <SupplierUnitSelect
                                value={getDisplayValue(article, 'unit') as string}
                                units={units}
                                onChange={(value) => handleFieldChange(article.id, 'unit', value)}
                                onCreateUnit={handleCreateUnit}
                                hasPending={hasPendingChange(article.id, 'unit')}
                                pendingInfo={getPendingChangeForField(article.id, 'unit')}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={priceInputs[article.id] !== undefined 
                                    ? priceInputs[article.id]
                                    : getPendingChangeForField(article.id, 'price')?.new_value?.replace('.', ',') 
                                      ?? String(article.price).replace('.', ',')}
                                  onChange={(e) => {
                                    setPriceInputs(prev => ({
                                      ...prev,
                                      [article.id]: e.target.value
                                    }));
                                  }}
                                  className={`h-8 ${hasPendingChange(article.id, 'price') ? 'border-amber-500' : ''}`}
                                />
                                {getPendingChangeForField(article.id, 'price') && (
                                  <div className="text-xs">
                                    <span className="text-amber-600">Ausstehend</span>
                                    <span className="text-muted-foreground ml-1">
                                      (vorher: {getPendingChangeForField(article.id, 'price')?.old_value?.replace('.', ',') || '-'} €)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  value={annualOrderValueInputs[article.id] !== undefined 
                                    ? annualOrderValueInputs[article.id]
                                    : getPendingChangeForField(article.id, 'annual_order_value')?.new_value?.replace('.', ',') 
                                      ?? (article.annual_order_value !== null ? String(article.annual_order_value).replace('.', ',') : '')}
                                  onChange={(e) => {
                                    setAnnualOrderValueInputs(prev => ({
                                      ...prev,
                                      [article.id]: e.target.value
                                    }));
                                  }}
                                  className={`h-8 ${hasPendingChange(article.id, 'annual_order_value') ? 'border-amber-500' : ''}`}
                                  placeholder="0,00"
                                />
                                {getPendingChangeForField(article.id, 'annual_order_value') && (
                                  <div className="text-xs">
                                    <span className="text-amber-600">Ausstehend</span>
                                    <span className="text-muted-foreground ml-1">
                                      (vorher: {getPendingChangeForField(article.id, 'annual_order_value')?.old_value?.replace('.', ',') || '-'} €)
                                    </span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <SupplierCategorySelect
                                value={(getDisplayValue(article, 'category') as string) || ''}
                                categories={categories}
                                onChange={(value) => handleFieldChange(article.id, 'category', value)}
                                onCreateCategory={handleCreateCategory}
                                hasPending={hasPendingChange(article.id, 'category')}
                                pendingInfo={getPendingChangeForField(article.id, 'category')}
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
                                    Einreichen
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile: Cards */}
                <div className="lg:hidden space-y-4">
                  {filteredArticles.map((article) => (
                    <SupplierArticleCard
                      key={article.id}
                      article={article}
                      editedArticles={editedArticles}
                      priceInputs={priceInputs}
                      annualOrderValueInputs={annualOrderValueInputs}
                      pendingChanges={pendingChanges}
                      saving={saving}
                      units={units}
                      categories={categories}
                      onFieldChange={handleFieldChange}
                      onPriceChange={(articleId, value) => {
                        setPriceInputs(prev => ({ ...prev, [articleId]: value }));
                      }}
                      onAnnualOrderValueChange={(articleId, value) => {
                        setAnnualOrderValueInputs(prev => ({ ...prev, [articleId]: value }));
                      }}
                      onSave={handleSave}
                      onCreateUnit={handleCreateUnit}
                      onCreateCategory={handleCreateCategory}
                    />
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Text */}
        {portalSettings.footer_text && (
          <div className="mt-8 text-center text-sm text-muted-foreground prose prose-sm dark:prose-invert max-w-none mx-auto">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {portalSettings.footer_text}
            </ReactMarkdown>
          </div>
        )}
      </main>

      {/* Suggest Article Dialog */}
      <SuggestArticleDialog
        open={suggestDialogOpen}
        onOpenChange={setSuggestDialogOpen}
        onSubmit={handleSuggestArticle}
        units={units}
        categories={categories}
        onCreateUnit={handleCreateUnit}
        onCreateCategory={handleCreateCategory}
      />
    </div>
  );
};

export default SupplierPortal;