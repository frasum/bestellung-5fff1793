import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wine, Grape, MapPin, Search, Lock, Eye, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WineArticle {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  selling_price: number | null;
  origin_country: string | null;
  grape_variety: string | null;
  flavor_profile: string | null;
  food_pairings: string | null;
  image_url: string | null;
  supplier: { id: string; name: string } | null;
}

interface TokenInfo {
  id: string;
  label: string;
  permission: 'view' | 'edit';
  employee: { id: string; name: string } | null;
  organization: { id: string; name: string } | null;
}

export default function WineCatalog() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [wines, setWines] = useState<WineArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const verifyToken = async (pinCode?: string) => {
    try {
      setLoading(true);
      setPinError(null);

      const { data, error: fnError } = await supabase.functions.invoke('verify-wine-catalog-token', {
        body: { token, pin: pinCode },
      });

      if (fnError) throw fnError;

      if (data.requiresPin) {
        setRequiresPin(true);
        setLoading(false);
        return;
      }

      if (data.error) {
        if (data.invalidPin) {
          setPinError(t('wineTokens.invalidPin'));
          setLoading(false);
          return;
        }
        if (data.rateLimited) {
          setPinError(t('wineTokens.tooManyAttempts'));
          setLoading(false);
          return;
        }
        throw new Error(data.error);
      }

      setTokenInfo(data.token);
      setWines(data.wines || []);
      setRequiresPin(false);
      setLoading(false);
    } catch (err: any) {
      console.error('Token verification error:', err);
      setError(err.message || t('wineTokens.verificationFailed'));
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      verifyToken(pin);
    }
  };

  const filteredWines = wines.filter(wine => 
    wine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.grape_variety?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wine.origin_country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedWines = filteredWines.reduce((acc, wine) => {
    const supplierName = wine.supplier?.name || 'Unbekannt';
    if (!acc[supplierName]) {
      acc[supplierName] = [];
    }
    acc[supplierName].push(wine);
    return acc;
  }, {} as Record<string, WineArticle[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Wine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('wineTokens.accessDenied')}</h2>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Lock className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-xl font-semibold">{t('wineTokens.pinRequired')}</h2>
              <p className="text-muted-foreground text-sm mt-2">{t('wineTokens.enterPin')}</p>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
                autoFocus
              />
              {pinError && (
                <p className="text-destructive text-sm text-center">{pinError}</p>
              )}
              <Button type="submit" className="w-full" disabled={pin.length !== 4}>
                {t('wineTokens.unlock')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Wine className="h-6 w-6 text-primary" />
              <div>
                <h1 className="font-semibold">{tokenInfo?.organization?.name || 'Weinkarte'}</h1>
                {tokenInfo?.employee && (
                  <p className="text-sm text-muted-foreground">
                    👋 {tokenInfo.employee.name}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={tokenInfo?.permission === 'edit' ? 'default' : 'secondary'}>
              {tokenInfo?.permission === 'edit' ? (
                <><Edit className="h-3 w-3 mr-1" />{t('wineTokens.canEdit')}</>
              ) : (
                <><Eye className="h-3 w-3 mr-1" />{t('wineTokens.viewOnly')}</>
              )}
            </Badge>
          </div>
          
          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('wineTokens.searchWines')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      {/* Wine List */}
      <main className="container mx-auto px-4 py-6">
        {Object.keys(groupedWines).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Wine className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? t('wineTokens.noSearchResults') : t('wineTokens.noWines')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedWines).map(([supplierName, supplierWines]) => (
              <section key={supplierName}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="text-primary">🍷</span> {supplierName}
                  <Badge variant="outline" className="ml-2">{supplierWines.length}</Badge>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {supplierWines.map((wine) => (
                    <Card key={wine.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {wine.image_url && (
                        <div className="aspect-[4/3] bg-gradient-to-b from-muted/50 to-muted flex items-center justify-center">
                          <img
                            src={wine.image_url}
                            alt={wine.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{wine.name}</h3>
                        
                        {wine.selling_price && (
                          <p className="text-xl font-bold text-primary mb-3">
                            €{wine.selling_price.toFixed(2)}
                          </p>
                        )}

                        {wine.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                            {wine.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          {wine.origin_country && (
                            <Badge variant="secondary" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {wine.origin_country}
                            </Badge>
                          )}
                          {wine.grape_variety && (
                            <Badge variant="secondary" className="gap-1">
                              <Grape className="h-3 w-3" />
                              {wine.grape_variety}
                            </Badge>
                          )}
                        </div>

                        {wine.flavor_profile && (
                          <p className="text-xs text-muted-foreground mt-3">
                            <span className="font-medium">🍷 </span>
                            {wine.flavor_profile}
                          </p>
                        )}

                        {wine.food_pairings && (
                          <p className="text-xs text-muted-foreground mt-2">
                            <span className="font-medium">🍽️ </span>
                            {wine.food_pairings}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
