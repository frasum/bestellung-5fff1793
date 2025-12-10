import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Search, Loader2, ShoppingCart, User, MapPin, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Article {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  category: string | null;
  sku: string | null;
  packaging_unit: number | null;
  supplier_id: string;
}

interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface TokenData {
  id: string;
  label: string;
  language: string;
  is_multi_supplier: boolean;
  employee_name: string | null;
  supplier: {
    id: string;
    name: string;
  } | null;
  location: {
    id: string;
    name: string;
  } | null;
  organization_id: string;
}

type OrderStatus = 'loading' | 'ready' | 'submitting' | 'success' | 'error';

const SimpleOrder = () => {
  const { token } = useParams<{ token: string }>();
  const { t, i18n } = useTranslation();
  
  const [status, setStatus] = useState<OrderStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [isEmployeeNameLocked, setIsEmployeeNameLocked] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ name?: boolean; location?: boolean }>({});

  // Verify token and load articles
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('ไม่มีโทเค็น / Kein Token');
        setStatus('error');
        return;
      }

      try {
        const { data, error: fetchError } = await supabase.functions.invoke('verify-simple-order-token', {
          body: { token },
        });

        if (fetchError || data?.error) {
          setError(data?.error || fetchError?.message || 'Token ไม่ถูกต้อง / Ungültiger Token');
          setStatus('error');
          return;
        }

        setTokenData(data.tokenData);
        setAllArticles(data.articles || []);
        setLocations(data.locations || []);
        
        // Handle multi-supplier tokens
        if (data.tokenData?.is_multi_supplier && data.suppliers) {
          setSuppliers(data.suppliers);
          // Don't filter articles yet - wait for supplier selection
          setArticles([]);
        } else {
          // Single supplier - show articles directly
          setArticles(data.articles || []);
          if (data.tokenData?.supplier) {
            setSelectedSupplierId(data.tokenData.supplier.id);
          }
        }
        
        // Set language from token
        if (data.tokenData?.language) {
          i18n.changeLanguage(data.tokenData.language);
        }
        
        // Pre-fill employee name if set on token
        if (data.tokenData?.employee_name) {
          setEmployeeName(data.tokenData.employee_name);
          setIsEmployeeNameLocked(true);
        }
        
        // Pre-select location if only one available
        if (data.locations?.length === 1) {
          setSelectedLocationId(data.locations[0].id);
        }
        
        setStatus('ready');
      } catch (err) {
        console.error('Error verifying token:', err);
        setError('เกิดข้อผิดพลาด / Fehler aufgetreten');
        setStatus('error');
      }
    };

    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Filter articles when supplier is selected
  useEffect(() => {
    if (selectedSupplierId && tokenData?.is_multi_supplier) {
      const filtered = allArticles.filter(a => a.supplier_id === selectedSupplierId);
      setArticles(filtered);
    }
  }, [selectedSupplierId, allArticles, tokenData?.is_multi_supplier]);

  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setQuantities({}); // Reset quantities when switching supplier
    setSearch('');
  };

  const handleBackToSuppliers = () => {
    setSelectedSupplierId(null);
    setQuantities({});
    setSearch('');
  };

  const handleQuantityChange = (articleId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[articleId] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [articleId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [articleId]: newValue };
    });
  };

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const validateForm = (): boolean => {
    const errors: { name?: boolean; location?: boolean } = {};
    
    // Only validate name if not locked (not pre-filled from token)
    if (!isEmployeeNameLocked && !employeeName.trim()) {
      errors.name = true;
    }
    if (!selectedLocationId) {
      errors.location = true;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (getTotalItems() === 0) return;
    
    if (!validateForm()) {
      return;
    }

    setStatus('submitting');

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([articleId, quantity]) => {
        const article = articles.find(a => a.id === articleId);
        return {
          article_id: articleId,
          article_name: article?.name || '',
          quantity,
        };
      });

    try {
      const { data, error: submitError } = await supabase.functions.invoke('submit-simple-order', {
        body: { 
          token, 
          items,
          employee_name: employeeName.trim(),
          location_id: selectedLocationId,
          supplier_id: selectedSupplierId,
        },
      });

      if (submitError || data?.error) {
        setError(data?.error || submitError?.message);
        setStatus('error');
        return;
      }

      setStatus('success');
      setQuantities({});
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('เกิดข้อผิดพลาดในการส่ง / Fehler beim Senden');
      setStatus('error');
    }
  };

  // Get current supplier name
  const getCurrentSupplierName = () => {
    if (!tokenData?.is_multi_supplier) {
      return tokenData?.supplier?.name || '';
    }
    if (selectedSupplierId) {
      return suppliers.find(s => s.id === selectedSupplierId)?.name || '';
    }
    return '';
  };

  // Get article count for supplier
  const getSupplierArticleCount = (supplierId: string) => {
    return allArticles.filter(a => a.supplier_id === supplierId).length;
  };

  // Filter articles by search
  const filteredArticles = articles.filter(article => 
    article.name.toLowerCase().includes(search.toLowerCase()) ||
    article.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const groupedArticles = filteredArticles.reduce((acc, article) => {
    const category = article.category || 'อื่นๆ / Sonstiges';
    if (!acc[category]) acc[category] = [];
    acc[category].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">กำลังโหลด... / Laden...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-destructive mb-2">
            ข้อผิดพลาด / Fehler
          </h1>
          <p className="text-muted-foreground text-lg">{error}</p>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            ส่งสำเร็จ! / Erfolgreich gesendet!
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            คำสั่งซื้อของคุณถูกส่งเพื่อตรวจสอบแล้ว
            <br />
            Ihre Bestellung wurde zur Prüfung eingereicht.
          </p>
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={() => {
              setStatus('ready');
              // Only reset employee name if not locked
              if (!isEmployeeNameLocked) {
                setEmployeeName('');
              }
            }}
          >
            สั่งซื้อใหม่ / Neue Bestellung
          </Button>
        </Card>
      </div>
    );
  }

  const languages = [
    { code: 'th', flag: '🇹🇭', label: 'ไทย' },
    { code: 'de', flag: '🇩🇪', label: 'DE' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'vi', flag: '🇻🇳', label: 'VI' },
    { code: 'fr', flag: '🇫🇷', label: 'FR' },
    { code: 'it', flag: '🇮🇹', label: 'IT' },
  ];

  // Show supplier selection for multi-supplier tokens
  const showSupplierSelection = tokenData?.is_multi_supplier && !selectedSupplierId;

  // Main order interface
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          {/* Language Switcher */}
          <div className="flex justify-center gap-1 mb-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  i18n.language === lang.code
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
                }`}
              >
                {lang.flag}
              </button>
            ))}
          </div>
          
          {/* Header with back button for multi-supplier */}
          <div className="flex items-center justify-center gap-3">
            {tokenData?.is_multi_supplier && selectedSupplierId && (
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleBackToSuppliers}
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold">
                {getCurrentSupplierName() || tokenData?.label}
              </h1>
              {(getCurrentSupplierName() && tokenData?.is_multi_supplier) && (
                <p className="text-primary-foreground/80 text-sm mt-1">
                  {tokenData?.label}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supplier Selection for Multi-Supplier Tokens */}
      {showSupplierSelection && (
        <div className="max-w-2xl mx-auto p-4">
          {/* Employee Info Section first */}
          <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-4">
            {/* Employee Name - Show greeting if locked, input if not */}
            {isEmployeeNameLocked ? (
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-primary">
                  👋 {t('simpleOrder.hello', 'สวัสดี / Hallo')}, {employeeName}!
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="employeeName" className="flex items-center gap-2 text-base font-medium mb-2">
                  <User className="h-5 w-5" />
                  {t('simpleOrder.yourName', 'ชื่อของคุณ / Ihr Name')} *
                </Label>
                <Input
                  id="employeeName"
                  type="text"
                  placeholder={t('simpleOrder.namePlaceholder', 'กรุณาใส่ชื่อของคุณ / Bitte Namen eingeben')}
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    if (e.target.value.trim()) {
                      setValidationErrors(prev => ({ ...prev, name: false }));
                    }
                  }}
                  className={`h-14 text-lg ${validationErrors.name ? 'border-destructive ring-destructive' : ''}`}
                />
              </div>
            )}

            {/* Location Selection */}
            <div>
              <Label className="flex items-center gap-2 text-base font-medium mb-2">
                <MapPin className="h-5 w-5" />
                {t('simpleOrder.selectLocation', 'เลือกสถานที่ / Standort wählen')} *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {locations.map((location) => (
                  <Button
                    key={location.id}
                    type="button"
                    variant={selectedLocationId === location.id ? "default" : "outline"}
                    className="h-14 text-lg font-medium"
                    onClick={() => {
                      setSelectedLocationId(location.id);
                      setValidationErrors(prev => ({ ...prev, location: false }));
                    }}
                  >
                    {location.short_code || location.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Supplier Selection */}
          <h2 className="text-xl font-semibold mb-4">
            {t('simpleOrder.selectSupplier', 'เลือกผู้จำหน่าย / Lieferant wählen')}
          </h2>
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                onClick={() => handleSupplierSelect(supplier.id)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{supplier.name}</h3>
                  <span className="text-muted-foreground">
                    {getSupplierArticleCount(supplier.id)} {t('simpleOrder.articles', 'รายการ / Artikel')}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Employee Info Section - only show when supplier is selected (or single supplier) */}
      {!showSupplierSelection && (
        <div className="bg-muted/50 border-b p-4">
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Employee Name - Show greeting if locked, input if not */}
            {isEmployeeNameLocked ? (
              <div className="text-center py-2">
                <p className="text-2xl font-bold text-primary">
                  👋 {t('simpleOrder.hello', 'สวัสดี / Hallo')}, {employeeName}!
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="employeeName2" className="flex items-center gap-2 text-base font-medium mb-2">
                  <User className="h-5 w-5" />
                  {t('simpleOrder.yourName', 'ชื่อของคุณ / Ihr Name')} *
                </Label>
                <Input
                  id="employeeName2"
                  type="text"
                  placeholder={t('simpleOrder.namePlaceholder', 'กรุณาใส่ชื่อของคุณ / Bitte Namen eingeben')}
                  value={employeeName}
                  onChange={(e) => {
                    setEmployeeName(e.target.value);
                    if (e.target.value.trim()) {
                      setValidationErrors(prev => ({ ...prev, name: false }));
                    }
                  }}
                  className={`h-14 text-lg ${validationErrors.name ? 'border-destructive ring-destructive' : ''}`}
                />
                {validationErrors.name && (
                  <p className="text-destructive text-sm mt-1">
                    {t('simpleOrder.nameRequired', 'กรุณาใส่ชื่อของคุณ / Bitte Namen eingeben')}
                  </p>
                )}
              </div>
            )}

            {/* Location Selection */}
            <div>
              <Label className="flex items-center gap-2 text-base font-medium mb-2">
                <MapPin className="h-5 w-5" />
                {t('simpleOrder.selectLocation', 'เลือกสถานที่ / Standort wählen')} *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {locations.map((location) => (
                  <Button
                    key={location.id}
                    type="button"
                    variant={selectedLocationId === location.id ? "default" : "outline"}
                    className={`h-14 text-lg font-medium ${
                      validationErrors.location && !selectedLocationId ? 'border-destructive' : ''
                    }`}
                    onClick={() => {
                      setSelectedLocationId(location.id);
                      setValidationErrors(prev => ({ ...prev, location: false }));
                    }}
                  >
                    {location.short_code || location.name}
                  </Button>
                ))}
              </div>
              {validationErrors.location && (
                <p className="text-destructive text-sm mt-1">
                  {t('simpleOrder.locationRequired', 'กรุณาเลือกสถานที่ / Bitte Standort wählen')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search - only show when supplier is selected */}
      {!showSupplierSelection && (
        <div className="sticky top-[72px] z-10 bg-background border-b p-3">
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ค้นหา... / Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>
      )}

      {/* Articles - only show when supplier is selected */}
      {!showSupplierSelection && (
        <div className="max-w-2xl mx-auto p-4">
          <div className="grid grid-cols-1 gap-3">
            {filteredArticles
              .sort((a, b) => a.name.localeCompare(b.name, 'de'))
              .map((article) => {
                  const qty = quantities[article.id] || 0;
                  const isSelected = qty > 0;
                  
                  return (
                    <Card
                      key={article.id}
                      className={`p-4 transition-all ${
                        isSelected 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Article info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {article.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {article.description || article.unit}
                          </p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant={qty > 0 ? "default" : "outline"}
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={() => handleQuantityChange(article.id, -1)}
                            disabled={qty === 0}
                          >
                            <Minus className="h-6 w-6" />
                          </Button>
                          
                          <span className="w-12 text-center text-2xl font-bold">
                            {qty}
                          </span>
                          
                          <Button
                            variant="default"
                            size="icon"
                            className="h-12 w-12 rounded-full"
                            onClick={() => handleQuantityChange(article.id, 1)}
                          >
                            <Plus className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                ไม่พบสินค้า / Keine Artikel gefunden
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fixed bottom bar - only show when supplier is selected */}
      {!showSupplierSelection && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
          <div className="max-w-2xl mx-auto">
            <Button
              size="lg"
              className="w-full h-16 text-xl font-bold gap-3"
              onClick={handleSubmit}
              disabled={getTotalItems() === 0 || status === 'submitting'}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  กำลังส่ง... / Wird gesendet...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-6 w-6" />
                  ส่งคำสั่งซื้อ / Bestellung senden
                  {getTotalItems() > 0 && (
                    <span className="bg-primary-foreground text-primary px-3 py-1 rounded-full text-lg">
                      {getTotalItems()}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleOrder;