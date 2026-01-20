import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Search, Pencil, Trash2, Package, Filter } from 'lucide-react';

interface SupplierSession {
  supplierId: string;
  supplierName: string;
  organizationId: string;
  sessionToken: string;
}

interface OwnVendor {
  id: string;
  name: string;
}

interface OwnArticle {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  unit: string;
  category: string | null;
  is_active: boolean;
  vendor?: OwnVendor;
}

interface Props {
  session: SupplierSession;
}

export const SupplierPortalOwnArticlesTab = ({ session }: Props) => {
  const [articles, setArticles] = useState<OwnArticle[]>([]);
  const [vendors, setVendors] = useState<OwnVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<OwnArticle | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    vendor_id: '',
    name: '',
    description: '',
    sku: '',
    price: '',
    unit: 'Stk',
    category: '',
  });

  const fetchData = async () => {
    try {
      const [articlesRes, vendorsRes] = await Promise.all([
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-articles',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
        supabase.functions.invoke('supplier-portal-articles', {
          body: {
            action: 'list-own-vendors',
            supplierId: session.supplierId,
            organizationId: session.organizationId,
            sessionToken: session.sessionToken,
          },
        }),
      ]);

      if (articlesRes.error) throw articlesRes.error;
      if (vendorsRes.error) throw vendorsRes.error;
      
      setArticles(articlesRes.data?.articles || []);
      setVendors(vendorsRes.data?.vendors || []);
    } catch (error: unknown) {
      console.error('Error fetching data:', error);
      toast.error('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  const categories = useMemo(() => {
    const cats = new Set(articles.map(a => a.category).filter(Boolean) as string[]);
    return Array.from(cats).sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVendor = vendorFilter === 'all' || a.vendor_id === vendorFilter;
      const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
      return matchesSearch && matchesVendor && matchesCategory;
    });
  }, [articles, searchTerm, vendorFilter, categoryFilter]);

  const handleOpenDialog = (article?: OwnArticle) => {
    if (article) {
      setSelectedArticle(article);
      setFormData({
        vendor_id: article.vendor_id,
        name: article.name,
        description: article.description || '',
        sku: article.sku || '',
        price: article.price.toString().replace('.', ','),
        unit: article.unit,
        category: article.category || '',
      });
    } else {
      setSelectedArticle(null);
      setFormData({ vendor_id: vendors[0]?.id || '', name: '', description: '', sku: '', price: '', unit: 'Stk', category: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }
    if (!formData.vendor_id) {
      toast.error('Bitte wählen Sie einen Lieferanten');
      return;
    }

    const priceValue = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(priceValue) || priceValue < 0) {
      toast.error('Bitte geben Sie einen gültigen Preis ein');
      return;
    }

    setSaving(true);
    try {
      const action = selectedArticle ? 'update-own-article' : 'create-own-article';
      const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action,
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleId: selectedArticle?.id,
          articleData: {
            vendor_id: formData.vendor_id,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            sku: formData.sku.trim() || null,
            price: priceValue,
            unit: formData.unit,
            category: formData.category.trim() || null,
          },
        },
      });

      if (error) throw error;
      
      toast.success(selectedArticle ? 'Artikel aktualisiert' : 'Artikel angelegt');
      setDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      console.error('Error saving article:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;

    try {
      const { error } = await supabase.functions.invoke('supplier-portal-articles', {
        body: {
          action: 'delete-own-article',
          supplierId: session.supplierId,
          organizationId: session.organizationId,
          sessionToken: session.sessionToken,
          articleId: selectedArticle.id,
        },
      });

      if (error) throw error;
      
      toast.success('Artikel gelöscht');
      setDeleteDialogOpen(false);
      setSelectedArticle(null);
      fetchData();
    } catch (error: unknown) {
      console.error('Error deleting article:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const getVendorName = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId)?.name || '-';
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">Keine Lieferanten vorhanden</h3>
          <p className="text-muted-foreground mb-4">
            Legen Sie zuerst einen Lieferanten an, bevor Sie Artikel hinzufügen können.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Mein Artikelkatalog
            </CardTitle>
            <CardDescription>
              {articles.length} Artikel von {vendors.length} Lieferanten
            </CardDescription>
          </div>
          <Button variant="accent" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Neu
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Alle Lieferanten" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Lieferanten</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Alle Kategorien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Artikel gefunden</p>
            <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Artikel anlegen
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Artikel</TableHead>
                    <TableHead>Lieferant</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="text-right">Preis</TableHead>
                    <TableHead>Einheit</TableHead>
                    <TableHead className="w-[100px]">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{article.name}</div>
                          {article.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {article.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getVendorName(article.vendor_id)}</TableCell>
                      <TableCell className="font-mono text-sm">{article.sku || '-'}</TableCell>
                      <TableCell>
                        {article.category && <Badge variant="secondary">{article.category}</Badge>}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatPrice(article.price)}</TableCell>
                      <TableCell>{article.unit}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(article)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setSelectedArticle(article); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{article.name}</h3>
                      <p className="text-sm text-muted-foreground">{getVendorName(article.vendor_id)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(article)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setSelectedArticle(article); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {article.category && <Badge variant="secondary">{article.category}</Badge>}
                      {article.sku && <span className="text-xs font-mono text-muted-foreground">{article.sku}</span>}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(article.price)}</div>
                      <div className="text-xs text-muted-foreground">/{article.unit}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lieferant *</Label>
              <Select value={formData.vendor_id} onValueChange={(v) => setFormData(prev => ({ ...prev, vendor_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Lieferant wählen" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Artikelname *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Riesling 2022"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preis (€) *</Label>
                <Input
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Einheit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Stk"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU / Art.-Nr.</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="ABC-123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Weißwein"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Zusätzliche Informationen..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{selectedArticle?.name}" wirklich löschen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
