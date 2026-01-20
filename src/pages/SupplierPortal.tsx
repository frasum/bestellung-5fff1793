import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useForceLightTheme } from '@/hooks/useForceLightTheme';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Search, Package, Loader2, Clock, Plus, FileDown, AlertCircle, SendHorizontal, Camera, Trash2, Upload, Pencil, Check, X, ShoppingCart, Building2, ClipboardList } from 'lucide-react';
import { SupplierArticleCard } from '@/components/suppliers/SupplierArticleCard';
import { SupplierUnitSelect } from '@/components/suppliers/SupplierUnitSelect';
import { SupplierOrderUnitSelect } from '@/components/suppliers/SupplierOrderUnitSelect';
import { SuggestArticleDialog } from '@/components/suppliers/SuggestArticleDialog';
import { SupplierPortalOrdersTab } from '@/components/suppliers/SupplierPortalOrdersTab';
import { SupplierPortalOwnVendorsTab } from '@/components/suppliers/SupplierPortalOwnVendorsTab';
import { SupplierPortalOwnArticlesTab } from '@/components/suppliers/SupplierPortalOwnArticlesTab';
import { SupplierPortalOwnInventoryTab } from '@/components/suppliers/SupplierPortalOwnInventoryTab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useSupplierPortalData,
  useSupplierArticleEditing,
  SupplierPortalHeader,
  lightModeStyles,
  defaultVisibleColumns,
} from './supplier-portal';

const SupplierPortal = () => {
  useForceLightTheme();
  
  const {
    session,
    articles,
    setArticles,
    pendingChanges,
    setPendingChanges,
    loading,
    units,
    setUnits,
    categories,
    setCategories,
    orderUnits,
    portalSettings,
    hasDraft,
    setHasDraft,
    initialDraftData,
    handleLogout,
  } = useSupplierPortalData();

  const {
    saving,
    savingDraft,
    savingAll,
    editedArticles,
    priceInputs,
    setPriceInputs,
    annualOrderValueInputs,
    setAnnualOrderValueInputs,
    orderUnitInputs,
    setOrderUnitInputs,
    descriptionInputs,
    setDescriptionInputs,
    referencePriceInputs,
    setReferencePriceInputs,
    uploadingImage,
    handleFieldChange,
    handleSaveDraft,
    handleDeleteDraft,
    handleSave,
    handleSaveAll,
    handleFileUpload,
    handleImageDelete,
    getDisplayValue,
    hasChanges,
    hasAnyChanges,
    getChangedArticleCount,
    getPendingChangeForField,
    hasPendingChange,
  } = useSupplierArticleEditing({
    session,
    articles,
    setArticles,
    pendingChanges,
    setPendingChanges,
    hasDraft,
    setHasDraft,
    initialDraftData,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [suggestDialogOpen, setSuggestDialogOpen] = useState(false);

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

    const { error } = await supabase.functions.invoke('supplier-portal-articles', {
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

  const visibleColumns = portalSettings.visible_columns || defaultVisibleColumns;
  const isColumnVisible = (column: string) => visibleColumns.includes(column);

  const canEditPrices = session?.priceEditExpiresAt 
    ? new Date(session.priceEditExpiresAt) > new Date() 
    : true;

  if (!session) {
    return (
      <div style={lightModeStyles} className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div style={lightModeStyles} className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100/50">
      <SupplierPortalHeader
        session={session}
        portalSettings={portalSettings}
        onLogout={handleLogout}
      />

      <main className="container mx-auto px-4 py-8">
        {hasDraft && (
          <Alert className="mb-6 bg-white border border-primary/30 shadow-sm rounded-xl">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="flex items-center justify-between text-gray-700">
              <span>Sie haben einen gespeicherten Entwurf. Ihre letzten Änderungen wurden wiederhergestellt.</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDeleteDraft}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                Entwurf verwerfen
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {portalSettings.welcome_message && (
          <div className="mb-6 p-5 bg-white rounded-xl shadow-sm border border-gray-100 prose prose-sm max-w-none prose-gray">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                    {children}
                  </a>
                ),
              }}
            >
              {portalSettings.welcome_message}
            </ReactMarkdown>
          </div>
        )}

        {portalSettings.info_text && (
          <div className="mb-6 p-5 bg-primary/5 border border-primary/15 rounded-xl prose prose-sm max-w-none prose-gray">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                    {children}
                  </a>
                ),
              }}
            >
              {portalSettings.info_text}
            </ReactMarkdown>
          </div>
        )}

        {session?.priceEditExpiresAt && new Date(session.priceEditExpiresAt) < new Date() && (
          <Alert className="mb-6 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700">
              Die Bearbeitungsfrist für Preise ist am {format(new Date(session.priceEditExpiresAt), 'dd.MM.yyyy', { locale: de })} abgelaufen. 
              Sie können weiterhin Bestellungen einsehen. Für einen neuen Zugangslink kontaktieren Sie bitte Ihren Ansprechpartner.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="bg-white border border-gray-200 shadow-sm p-1 rounded-xl">
            <TabsTrigger 
              value="articles" 
              className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Package className="h-4 w-4" />
              Artikel
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <ShoppingCart className="h-4 w-4" />
              Bestellungen
            </TabsTrigger>
            <TabsTrigger 
              value="purchasing" 
              className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              <Building2 className="h-4 w-4" />
              Mein Einkauf
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles">
            <Card className="bg-white border-gray-100 shadow-sm rounded-xl">
              <CardHeader className="border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Package className="h-5 w-5 text-primary" />
                      {portalSettings.card_title}
                    </CardTitle>
                    <CardDescription className="text-gray-500">
                      {portalSettings.card_description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    {pendingChanges.filter(c => c.status === 'pending').length > 0 && (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 font-normal">
                        <Clock className="h-3 w-3" />
                        {pendingChanges.filter(c => c.status === 'pending').length} ausstehend
                      </Badge>
                    )}
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {articles.length} Artikel
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Artikel suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      onClick={handleSaveDraft} 
                      disabled={!hasAnyChanges() || savingDraft || savingAll}
                      className="border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
                      className="bg-primary hover:bg-primary/90 shadow-sm"
                    >
                      {savingAll ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <SendHorizontal className="h-4 w-4 mr-2" />
                      )}
                      Alle einreichen {hasAnyChanges() && `(${getChangedArticleCount()})`}
                    </Button>
                    <Button 
                      onClick={() => setSuggestDialogOpen(true)} 
                      className="shrink-0 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900" 
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Neuen Artikel vorschlagen
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchTerm ? 'Keine Artikel gefunden' : 'Noch keine Artikel vorhanden'}
                  </div>
                ) : (
                  <>
                    {/* Desktop: Table */}
                    <div className="hidden lg:block border border-gray-100 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50 border-b border-gray-100">
                            {isColumnVisible('image') && <TableHead className="w-[70px] text-gray-600 font-medium">Foto</TableHead>}
                            <TableHead className="min-w-[280px] text-gray-600 font-medium">Artikelname</TableHead>
                            {isColumnVisible('sku') && <TableHead className="w-[120px] text-gray-600 font-medium">SKU</TableHead>}
                            {isColumnVisible('unit') && <TableHead className="w-[70px] text-gray-600 font-medium">Einheit</TableHead>}
                            {isColumnVisible('packaging_unit') && <TableHead className="w-[120px] text-gray-600 font-medium">BE</TableHead>}
                            {isColumnVisible('price') && <TableHead className="w-[110px] text-gray-600 font-medium">Preis (€)</TableHead>}
                            {isColumnVisible('annual_order_value') && <TableHead className="w-[120px] text-gray-600 font-medium">Bestellwert (365T)</TableHead>}
                            {isColumnVisible('reference_price') && <TableHead className="w-[110px] text-gray-600 font-medium">Ref.-Preis (€)</TableHead>}
                            {isColumnVisible('reference_unit') && <TableHead className="w-[60px] text-gray-600 font-medium">Ref.-Einheit</TableHead>}
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredArticles.map((article) => (
                            <TableRow key={article.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              {isColumnVisible('image') && (
                                <TableCell className="py-2">
                                  <div className="relative group">
                                    {uploadingImage === article.id ? (
                                      <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                      </div>
                                    ) : article.image_url ? (
                                      <div className="relative w-12 h-12">
                                        <img 
                                          src={article.image_url} 
                                          alt={article.name}
                                          className="w-12 h-12 object-cover rounded border"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                                          <label className="cursor-pointer p-1 hover:bg-white/20 rounded">
                                            <Camera className="h-3.5 w-3.5 text-white" />
                                            <input 
                                              type="file" 
                                              accept="image/*"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleFileUpload(article.id, file);
                                                e.target.value = '';
                                              }}
                                            />
                                          </label>
                                          <button 
                                            className="p-1 hover:bg-white/20 rounded"
                                            onClick={() => handleImageDelete(article.id)}
                                          >
                                            <Trash2 className="h-3.5 w-3.5 text-white" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <label className="cursor-pointer w-12 h-12 flex items-center justify-center border border-dashed rounded hover:border-primary hover:bg-muted/50 transition-colors">
                                        <Upload className="h-4 w-4 text-muted-foreground" />
                                        <input 
                                          type="file" 
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(article.id, file);
                                            e.target.value = '';
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="max-w-[350px]">
                                <div>
                                  <span className="font-medium">{article.name}</span>
                                  {isColumnVisible('description') && (
                                    editingDescription === article.id ? (
                                      <div className="mt-1 space-y-1">
                                        <Textarea
                                          autoFocus
                                          value={descriptionInputs[article.id] ?? article.description ?? ''}
                                          onChange={(e) => setDescriptionInputs(prev => ({
                                            ...prev,
                                            [article.id]: e.target.value
                                          }))}
                                          className="min-h-[60px] text-sm"
                                          placeholder="Beschreibung eingeben..."
                                        />
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2"
                                            onClick={() => {
                                              handleFieldChange(article.id, 'description', descriptionInputs[article.id] ?? article.description);
                                              setEditingDescription(null);
                                            }}
                                          >
                                            <Check className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 px-2"
                                            onClick={() => {
                                              setDescriptionInputs(prev => {
                                                const newState = { ...prev };
                                                delete newState[article.id];
                                                return newState;
                                              });
                                              setEditingDescription(null);
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className="group flex items-start gap-1 cursor-pointer mt-0.5"
                                        onClick={() => setEditingDescription(article.id)}
                                      >
                                        {article.description || descriptionInputs[article.id] ? (
                                          <p className={cn(
                                            "text-sm text-muted-foreground line-clamp-2 hover:text-foreground",
                                            descriptionInputs[article.id] !== undefined && "border-l-2 border-amber-500 pl-1"
                                          )}>
                                            {descriptionInputs[article.id] ?? article.description}
                                          </p>
                                        ) : (
                                          <span className="text-sm text-muted-foreground/50 italic hover:text-muted-foreground flex items-center gap-1">
                                            <Pencil className="h-3 w-3" />
                                            Beschreibung hinzufügen
                                          </span>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </TableCell>
                              {isColumnVisible('sku') && (
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
                              )}
                              {isColumnVisible('unit') && (
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
                              )}
                              {isColumnVisible('packaging_unit') && (
                                <TableCell>
                                  <SupplierOrderUnitSelect
                                    value={orderUnitInputs[article.id] !== undefined 
                                      ? orderUnitInputs[article.id]
                                      : getPendingChangeForField(article.id, 'order_unit_id')?.new_value 
                                        ?? article.order_unit_id ?? null}
                                    onChange={(value) => {
                                      setOrderUnitInputs(prev => ({
                                        ...prev,
                                        [article.id]: value ?? ''
                                      }));
                                    }}
                                    hasPending={hasPendingChange(article.id, 'order_unit_id')}
                                    pendingInfo={getPendingChangeForField(article.id, 'order_unit_id')}
                                    externalOrderUnits={orderUnits}
                                  />
                                </TableCell>
                              )}
                              {isColumnVisible('price') && (
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
                                        if (!canEditPrices) return;
                                        setPriceInputs(prev => ({
                                          ...prev,
                                          [article.id]: e.target.value
                                        }));
                                      }}
                                      readOnly={!canEditPrices}
                                      className={cn(
                                        "h-8 text-right", 
                                        hasPendingChange(article.id, 'price') && "border-amber-500",
                                        !canEditPrices && "bg-muted cursor-not-allowed opacity-60"
                                      )}
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
                              )}
                              {isColumnVisible('annual_order_value') && (
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
                                        if (!canEditPrices) return;
                                        setAnnualOrderValueInputs(prev => ({
                                          ...prev,
                                          [article.id]: e.target.value
                                        }));
                                      }}
                                      readOnly={!canEditPrices}
                                      className={cn(
                                        "h-8",
                                        hasPendingChange(article.id, 'annual_order_value') && "border-amber-500",
                                        !canEditPrices && "bg-muted cursor-not-allowed opacity-60"
                                      )}
                                      placeholder="Optional"
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
                              )}
                              {isColumnVisible('reference_price') && (
                                <TableCell>
                                  <div className="space-y-1">
                                    <Input
                                      type="text"
                                      inputMode="decimal"
                                      value={referencePriceInputs[article.id] !== undefined 
                                        ? referencePriceInputs[article.id]
                                        : getPendingChangeForField(article.id, 'reference_price')?.new_value?.replace('.', ',') 
                                          ?? (article.reference_price !== null ? String(article.reference_price).replace('.', ',') : '')}
                                      onChange={(e) => {
                                        if (!canEditPrices) return;
                                        setReferencePriceInputs(prev => ({
                                          ...prev,
                                          [article.id]: e.target.value
                                        }));
                                      }}
                                      readOnly={!canEditPrices}
                                      className={cn(
                                        "h-8 text-right", 
                                        hasPendingChange(article.id, 'reference_price') && "border-amber-500",
                                        !canEditPrices && "bg-muted cursor-not-allowed opacity-60"
                                      )}
                                      placeholder="-"
                                    />
                                    {getPendingChangeForField(article.id, 'reference_price') && (
                                      <div className="text-xs">
                                        <span className="text-amber-600">Ausstehend</span>
                                        <span className="text-muted-foreground ml-1">
                                          (vorher: {getPendingChangeForField(article.id, 'reference_price')?.old_value?.replace('.', ',') || '-'} €)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                              {isColumnVisible('reference_unit') && (
                                <TableCell>
                                  <div className="space-y-1">
                                    <Input
                                      value={(getDisplayValue(article, 'reference_unit') as string) || ''}
                                      onChange={(e) => handleFieldChange(article.id, 'reference_unit', e.target.value || null)}
                                      className={`h-8 ${hasPendingChange(article.id, 'reference_unit') ? 'border-amber-500' : ''}`}
                                      placeholder="-"
                                    />
                                    {getPendingChangeForField(article.id, 'reference_unit') && (
                                      <div className="text-xs">
                                        <span className="text-amber-600">Ausstehend</span>
                                        <span className="text-muted-foreground ml-1">
                                          (vorher: {getPendingChangeForField(article.id, 'reference_unit')?.old_value || '-'})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              )}
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
                          ))}
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
                          orderUnitInputs={orderUnitInputs}
                          referencePriceInputs={referencePriceInputs}
                          pendingChanges={pendingChanges}
                          saving={saving}
                          units={units}
                          categories={categories}
                          orderUnits={orderUnits}
                          visibleColumns={visibleColumns}
                          isMissingAnnualValue={false}
                          uploadingImage={uploadingImage}
                          onFieldChange={handleFieldChange}
                          onPriceChange={(articleId, value) => {
                            setPriceInputs(prev => ({ ...prev, [articleId]: value }));
                          }}
                          onAnnualOrderValueChange={(articleId, value) => {
                            setAnnualOrderValueInputs(prev => ({ ...prev, [articleId]: value }));
                          }}
                          onOrderUnitChange={(articleId, value) => {
                            setOrderUnitInputs(prev => ({ ...prev, [articleId]: value }));
                          }}
                          onReferencePriceChange={(articleId, value) => {
                            setReferencePriceInputs(prev => ({ ...prev, [articleId]: value }));
                          }}
                          onSave={handleSave}
                          onCreateUnit={handleCreateUnit}
                          onCreateCategory={handleCreateCategory}
                          onImageUpload={async (articleId, base64) => {
                            const { data, error } = await supabase.functions.invoke('supplier-portal-articles', {
                              body: {
                                action: 'upload-image',
                                supplierId: session.supplierId,
                                organizationId: session.organizationId,
                                sessionToken: session.sessionToken,
                                articleId,
                                base64Image: base64,
                              },
                            });
                            if (!error) {
                              setArticles(prev => prev.map(a => 
                                a.id === articleId ? { ...a, image_url: data.imageUrl } : a
                              ));
                            }
                          }}
                          onImageDelete={handleImageDelete}
                        />
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <SupplierPortalOrdersTab session={session} />
          </TabsContent>

          <TabsContent value="purchasing">
            <Tabs defaultValue="vendors" className="space-y-4">
              <TabsList className="bg-white border border-gray-200 shadow-sm p-1 rounded-xl">
                <TabsTrigger 
                  value="vendors" 
                  className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Building2 className="h-4 w-4" />
                  Lieferanten
                </TabsTrigger>
                <TabsTrigger 
                  value="own-articles" 
                  className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Package className="h-4 w-4" />
                  Artikelkatalog
                </TabsTrigger>
                <TabsTrigger 
                  value="inventory" 
                  className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <ClipboardList className="h-4 w-4" />
                  Inventur
                </TabsTrigger>
              </TabsList>

              <TabsContent value="vendors">
                <SupplierPortalOwnVendorsTab session={session} />
              </TabsContent>
              <TabsContent value="own-articles">
                <SupplierPortalOwnArticlesTab session={session} />
              </TabsContent>
              <TabsContent value="inventory">
                <SupplierPortalOwnInventoryTab session={session} />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        {portalSettings.footer_text && (
          <div className="mt-8 text-center text-sm text-gray-500 prose prose-sm max-w-none mx-auto">
            <ReactMarkdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
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
