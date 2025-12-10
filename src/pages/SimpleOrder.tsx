import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Send, Check, Search, Loader2, ShoppingCart, User, MapPin } from 'lucide-react';
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
}

interface Location {
  id: string;
  name: string;
  short_code: string | null;
}

interface TokenData {
  id: string;
  label: string;
  language: string;
  supplier: {
    id: string;
    name: string;
  };
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
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
        setArticles(data.articles || []);
        setLocations(data.locations || []);
        
        // Set language from token
        if (data.tokenData?.language) {
          i18n.changeLanguage(data.tokenData.language);
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
  }, [token, i18n]);

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
    
    if (!employeeName.trim()) {
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
              setEmployeeName('');
            }}
          >
            สั่งซื้อใหม่ / Neue Bestellung
          </Button>
        </Card>
      </div>
    );
  }

  // Main order interface
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-center">
            {tokenData?.supplier?.name}
          </h1>
          <p className="text-center text-primary-foreground/80 text-sm mt-1">
            {tokenData?.label}
          </p>
        </div>
      </div>

      {/* Employee Info Section */}
      <div className="bg-muted/50 border-b p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Employee Name */}
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
            {validationErrors.name && (
              <p className="text-destructive text-sm mt-1">
                {t('simpleOrder.nameRequired', 'กรุณาใส่ชื่อของคุณ / Bitte Namen eingeben')}
              </p>
            )}
          </div>

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

      {/* Search */}
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

      {/* Articles */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {Object.entries(groupedArticles).map(([category, categoryArticles]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold text-muted-foreground mb-3 sticky top-[140px] bg-background py-2">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {categoryArticles.map((article) => {
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
                          {article.unit}
                          {article.packaging_unit && article.packaging_unit > 1 && (
                            <span className="ml-1">({article.packaging_unit}er)</span>
                          )}
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
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              ไม่พบสินค้า / Keine Artikel gefunden
            </p>
          </div>
        )}
      </div>

      {/* Fixed bottom bar */}
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
    </div>
  );
};

export default SimpleOrder;