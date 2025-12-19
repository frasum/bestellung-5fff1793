import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  usePriceWatchSettings, 
  useUpdatePriceWatchSettings,
  useRunPriceSearch,
  usePriceWatchResults
} from '@/hooks/usePriceWatch';
import { useOrganization } from '@/hooks/useSettings';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingDown, 
  Search, 
  Mail, 
  MapPin, 
  Loader2,
  RefreshCw,
  Clock,
  Settings,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export const PriceWatchSettingsTab = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: settings, isLoading } = usePriceWatchSettings();
  const { data: organization } = useOrganization();
  const { data: results } = usePriceWatchResults();
  const { data: dbCategories = [], isLoading: categoriesLoading } = useCategories();
  const updateSettings = useUpdatePriceWatchSettings();
  const runPriceSearch = useRunPriceSearch();

  // Get unique category names from database, removing duplicates
  const availableCategories = useMemo(() => {
    const categoryNames = dbCategories.map(cat => cat.name);
    return [...new Set(categoryNames)].sort();
  }, [dbCategories]);

  const [isEnabled, setIsEnabled] = useState(true);
  const [minSavingsPercent, setMinSavingsPercent] = useState(5);
  const [searchRadiusKm, setSearchRadiusKm] = useState(50);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchFrequency, setSearchFrequency] = useState('daily');
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Initialize selected categories when db categories are loaded
  useEffect(() => {
    if (availableCategories.length > 0 && selectedCategories.length === 0 && !settings) {
      setSelectedCategories(availableCategories);
    }
  }, [availableCategories, selectedCategories.length, settings]);

  // Load settings when available
  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.is_enabled);
      setMinSavingsPercent(settings.min_savings_percent);
      setSearchRadiusKm(settings.search_radius_km);
      // Use saved categories, or fall back to all available
      setSelectedCategories(settings.categories?.length ? settings.categories : availableCategories);
      setSearchFrequency(settings.search_frequency);
      setEmailNotifications(settings.email_notifications);
    }
  }, [settings, availableCategories]);

  const handleSaveSettings = () => {
    if (!organization?.id) return;
    
    updateSettings.mutate({
      organization_id: organization.id,
      is_enabled: isEnabled,
      min_savings_percent: minSavingsPercent,
      search_radius_km: searchRadiusKm,
      categories: selectedCategories,
      search_frequency: searchFrequency,
      email_notifications: emailNotifications,
    });
  };

  const handleRunSearch = () => {
    if (!organization?.id) return;
    runPriceSearch.mutate({ 
      organization_id: organization.id,
      max_articles: 20 
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const activeResultsCount = results?.filter(r => !r.is_dismissed && !r.is_reviewed).length || 0;
  const totalSavings = results
    ?.filter(r => !r.is_dismissed && !r.is_reviewed)
    .reduce((sum, r) => sum + r.savings_amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-200 dark:border-emerald-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <TrendingDown className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                  Preisüberwachung
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  {isEnabled ? 'Aktiv' : 'Deaktiviert'} •{' '}
                  <span 
                    className="cursor-pointer hover:underline"
                    onClick={() => navigate('/reports?tab=pricewatch')}
                  >
                    {activeResultsCount} Einsparmöglichkeiten
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {totalSavings > 0 && (
                <Badge 
                  className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 px-3 py-1 text-sm cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-900/70"
                  onClick={() => navigate('/reports?tab=pricewatch')}
                >
                  €{totalSavings.toFixed(2)} Einsparpotential
                </Badge>
              )}
              <Switch 
                checked={isEnabled} 
                onCheckedChange={setIsEnabled}
              />
            </div>
          </div>
          
          {settings?.last_search_at && (
            <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                <Clock className="w-4 h-4" />
                <span>
                  Letzte Suche: {format(new Date(settings.last_search_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                </span>
                {settings.last_search_results_count !== null && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 cursor-pointer hover:bg-secondary/80"
                    onClick={() => navigate('/reports?tab=pricewatch')}
                  >
                    {settings.last_search_results_count} Ergebnisse
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="w-4 h-4" />
              Allgemeine Einstellungen
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie, wie die Preissuche durchgeführt werden soll
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Minimum Savings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Mindest-Ersparnis für Benachrichtigung</Label>
                <Badge variant="outline" className="font-mono">
                  {minSavingsPercent}%
                </Badge>
              </div>
              <Slider
                value={[minSavingsPercent]}
                onValueChange={([value]) => setMinSavingsPercent(value)}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Sie werden nur benachrichtigt, wenn ein Preis mindestens {minSavingsPercent}% günstiger ist.
              </p>
            </div>

            {/* Search Radius */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Suchradius
                </Label>
                <Badge variant="outline" className="font-mono">
                  {searchRadiusKm} km
                </Badge>
              </div>
              <Slider
                value={[searchRadiusKm]}
                onValueChange={([value]) => setSearchRadiusKm(value)}
                min={10}
                max={150}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Suche nach Lieferanten im Umkreis von {searchRadiusKm} km.
              </p>
            </div>

            {/* Search Frequency */}
            <div className="space-y-2">
              <Label>Suchfrequenz</Label>
              <Select value={searchFrequency} onValueChange={setSearchFrequency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="manual">Nur manuell</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="w-4 h-4" />
              Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Wählen Sie, wie Sie über günstigere Preise informiert werden möchten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">E-Mail-Benachrichtigungen</p>
                  <p className="text-xs text-muted-foreground">
                    Erhalten Sie E-Mails bei neuen Einsparmöglichkeiten
                  </p>
                </div>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Dashboard-Benachrichtigungen</p>
                  <p className="text-xs text-muted-foreground">
                    Immer aktiv - sehen Sie Alerts im Dashboard
                  </p>
                </div>
              </div>
              <Switch checked disabled />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zu überwachende Kategorien</CardTitle>
          <CardDescription>
            Wählen Sie die Produktkategorien aus, für die Preise gesucht werden sollen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : availableCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Keine Kategorien gefunden. Erstellen Sie zuerst Kategorien für Ihre Artikel.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {availableCategories.map(category => (
                  <div
                    key={category}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedCategories.includes(category)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'}
                    `}
                    onClick={() => toggleCategory(category)}
                  >
                    <Checkbox 
                      checked={selectedCategories.includes(category)}
                    />
                    <Label className="text-sm cursor-pointer">{category}</Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                {selectedCategories.length} von {availableCategories.length} Kategorien ausgewählt
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <Button
          variant="outline"
          onClick={handleRunSearch}
          disabled={runPriceSearch.isPending || !organization?.id}
          className="order-2 sm:order-1"
        >
          {runPriceSearch.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Preise jetzt prüfen
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={updateSettings.isPending || !organization?.id}
          className="order-1 sm:order-2"
        >
          {updateSettings.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Einstellungen speichern
        </Button>
      </div>
    </div>
  );
};
