import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, 
  LayoutDashboard, 
  Truck, 
  Smartphone, 
  Building2,
  Users,
  Search,
  Filter,
  Shield,
  User,
  Key,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Route,
  Layers,
  Lock,
  Zap,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Types
interface RouteInfo {
  path: string;
  name: string;
  component: string;
  authRequired: 'none' | 'user' | 'admin' | 'token';
  description: string;
  features: string[];
  tabs?: string[];
}

interface ModuleInfo {
  id: string;
  name: string;
  icon: LucideIcon;
  colorClasses: {
    bg: string;
    text: string;
    badge: string;
  };
  description: string;
  routes: RouteInfo[];
}

// Module data
const modules: ModuleInfo[] = [
  {
    id: 'public',
    name: 'Öffentliche Seiten',
    icon: Globe,
    colorClasses: {
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-600 dark:text-sky-400',
      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
    },
    description: 'Ohne Anmeldung zugänglich - Landingpages, rechtliche Seiten',
    routes: [
      { path: '/', name: 'Landingpage', component: 'Presentation.tsx', authRequired: 'none', description: 'Startseite mit Produktvorstellung', features: ['Hero-Section', 'Features', 'Preise', 'Testimonials', 'CTA'] },
      { path: '/pricing', name: 'Preisübersicht', component: 'Pricing.tsx', authRequired: 'none', description: 'Detaillierte Preispläne', features: ['Planvergleich', 'Feature-Matrix', 'FAQ'] },
      { path: '/agb', name: 'AGB', component: 'AGB.tsx', authRequired: 'none', description: 'Allgemeine Geschäftsbedingungen', features: ['Rechtliche Texte'] },
      { path: '/impressum', name: 'Impressum', component: 'Impressum.tsx', authRequired: 'none', description: 'Impressum und Kontaktdaten', features: ['Firmendaten', 'Kontakt'] },
      { path: '/datenschutz', name: 'Datenschutz', component: 'Datenschutz.tsx', authRequired: 'none', description: 'Datenschutzerklärung', features: ['DSGVO-konform'] },
    ],
  },
  {
    id: 'auth',
    name: 'Authentifizierung',
    icon: Lock,
    colorClasses: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    },
    description: 'Login und Registrierung für verschiedene Benutzertypen',
    routes: [
      { path: '/auth', name: 'Login/Registrierung', component: 'Auth.tsx', authRequired: 'none', description: 'Hauptanmeldung für Restaurant-Kunden', features: ['Email-Login', 'Magic Link', 'Registrierung', 'Passwort-Reset'] },
      { path: '/supplier/auth', name: 'Lieferanten-Login', component: 'SupplierAuth.tsx', authRequired: 'none', description: 'Portal-Login für Lieferanten', features: ['Magic Link', 'Token-basiert'] },
      { path: '/b2b/login', name: 'B2B Supplier Login', component: 'B2BSupplierLogin.tsx', authRequired: 'none', description: 'Login für B2B-Lieferanten', features: ['Email/Passwort', 'Session-Management'] },
    ],
  },
  {
    id: 'main',
    name: 'Hauptanwendung',
    icon: LayoutDashboard,
    colorClasses: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    description: 'Kernfunktionen für Bestellmanagement und Katalogverwaltung',
    routes: [
      { path: '/suppliers', name: 'Katalog', component: 'Suppliers.tsx', authRequired: 'user', description: 'Lieferanten- und Artikelverwaltung', features: ['Lieferanten anlegen', 'Artikel verwalten', 'Kategorien', 'Preishistorie', 'Import/Export'], tabs: ['Lieferanten', 'Artikel', 'Weine', 'Vorschläge'] },
      { path: '/orders', name: 'Bestellungen', component: 'Orders.tsx', authRequired: 'user', description: 'Bestellübersicht und -verwaltung', features: ['Bestellhistorie', 'Status-Tracking', 'Vorbestellungen', 'EasyOrder-Verwaltung'], tabs: ['Bestellungen', 'Vorbestellungen', 'EasyOrder'] },
      { path: '/reports', name: 'Berichte', component: 'Reports.tsx', authRequired: 'user', description: 'Analysen und Auswertungen', features: ['Bestellstatistiken', 'Lieferantenanalyse', 'Inventur'], tabs: ['Übersicht', 'Inventur'] },
      { path: '/settings', name: 'Einstellungen', component: 'Settings.tsx', authRequired: 'user', description: 'Profil- und Organisationseinstellungen', features: ['Profilverwaltung', 'Team-Management', 'Standorte', 'E-Mail-Templates', 'Benachrichtigungen'], tabs: ['Profil', 'Organisation', 'Kommunikation', 'Team', 'Mitarbeiter'] },
      { path: '/cart', name: 'Warenkorb', component: 'Cart.tsx', authRequired: 'user', description: 'Aktueller Warenkorb', features: ['Mengen ändern', 'Artikel entfernen', 'Liefertermin'] },
      { path: '/checkout', name: 'Kasse', component: 'Checkout.tsx', authRequired: 'user', description: 'Bestellung abschließen', features: ['Bestellübersicht', 'E-Mail-Vorschau', 'Bestellung senden'] },
    ],
  },
  {
    id: 'supplier-portal',
    name: 'Lieferanten-Portal',
    icon: Truck,
    colorClasses: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    },
    description: 'Externes Portal für Lieferanten zur Artikelpflege',
    routes: [
      { path: '/supplier/portal', name: 'Artikel bearbeiten', component: 'SupplierPortal.tsx', authRequired: 'token', description: 'Lieferanten pflegen ihre Artikel selbst', features: ['Preise aktualisieren', 'Neue Artikel', 'Änderungsvorschläge', 'Bestelleingang'] },
      { path: '/supplier/login', name: 'Portal-Zugang', component: 'SupplierLogin.tsx', authRequired: 'none', description: 'Magic-Link Anforderung', features: ['Magic Link anfordern'] },
    ],
  },
  {
    id: 'easyorder',
    name: 'EasyOrder / Kiosk',
    icon: Smartphone,
    colorClasses: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    },
    description: 'Vereinfachte Bestellung für Mitarbeiter ohne Login',
    routes: [
      { path: '/simple-order', name: 'EasyOrder', component: 'SimpleOrder.tsx', authRequired: 'token', description: 'Bestellung per QR-Code/Link', features: ['PIN-Eingabe', 'Kategorieauswahl', 'Schnellbestellung', 'Sprachauswahl', 'Freitext-Artikel'] },
      { path: '/wine-catalog', name: 'Weinkarte', component: 'WineCatalog.tsx', authRequired: 'token', description: 'Digitale Weinkarte für Gäste', features: ['Filterfunktion', 'Detailansicht', 'PDF-Export'] },
    ],
  },
  {
    id: 'b2b-supplier',
    name: 'B2B Supplier Portal',
    icon: Building2,
    colorClasses: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    },
    description: 'Portal für Großhändler mit eigenem Kundenstamm',
    routes: [
      { path: '/b2b/portal', name: 'B2B Dashboard', component: 'B2BSupplierDashboard.tsx', authRequired: 'user', description: 'Verwaltung des B2B-Geschäfts', features: ['Artikelverwaltung', 'Kundenverwaltung', 'Bestelleingang', 'Angebotserstellung', 'Eigener Einkauf'], tabs: ['Artikel', 'Kunden', 'Bestellungen', 'Angebote', 'Mein Einkauf', 'Einstellungen'] },
    ],
  },
  {
    id: 'b2b-customer',
    name: 'B2B Kunden-Portal',
    icon: Users,
    colorClasses: {
      bg: 'bg-pink-100 dark:bg-pink-900/30',
      text: 'text-pink-600 dark:text-pink-400',
      badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
    },
    description: 'Portal für Kunden von B2B-Lieferanten',
    routes: [
      { path: '/b2b/customer', name: 'Kundenportal', component: 'B2BCustomerPortal.tsx', authRequired: 'user', description: 'Bestellung bei B2B-Lieferanten', features: ['Katalog durchsuchen', 'Warenkorb', 'Bestellhistorie', 'Eigene Lieferanten'], tabs: ['Einkauf', 'Warenkorb', 'Bestellungen', 'Meine Lieferanten'] },
      { path: '/b2b/accept-invitation', name: 'Einladung annehmen', component: 'B2BAcceptInvitation.tsx', authRequired: 'none', description: 'B2B-Kundenregistrierung', features: ['Token-Validierung', 'Konto erstellen'] },
    ],
  },
  {
    id: 'special',
    name: 'Spezialseiten',
    icon: FileText,
    colorClasses: {
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    },
    description: 'Sonderseiten für spezielle Anwendungsfälle',
    routes: [
      { path: '/photo-capture', name: 'QR Foto-Upload', component: 'PhotoCapture.tsx', authRequired: 'token', description: 'Artikelfotos per Smartphone', features: ['Kamera-Zugriff', 'Artikel-Zuweisung', 'Batch-Upload'] },
      { path: '/onboarding', name: 'Onboarding', component: 'Onboarding.tsx', authRequired: 'user', description: 'Ersteinrichtung nach Registrierung', features: ['Schritt-für-Schritt', 'Branchen-Templates', 'Demo-Daten'] },
      { path: '/question-onboarding', name: 'Fragen-Onboarding', component: 'QuestionOnboarding.tsx', authRequired: 'user', description: 'Geführte Einrichtung per Fragen', features: ['Interaktiver Wizard', 'Branchenauswahl'] },
      { path: '/style-guide', name: 'Design System', component: 'StyleGuide.tsx', authRequired: 'admin', description: 'Komponenten-Übersicht', features: ['UI-Komponenten', 'Farben', 'Typografie'] },
      { path: '/system-architecture', name: 'Systemarchitektur', component: 'SystemArchitecture.tsx', authRequired: 'admin', description: 'Diese Seite', features: ['Modulübersicht', 'Routen-Dokumentation'] },
      { path: '/database-architecture', name: 'Datenbankarchitektur', component: 'DatabaseArchitecture.tsx', authRequired: 'admin', description: 'Datenbankstruktur', features: ['Tabellenübersicht', 'Beziehungen', 'RLS-Policies'] },
    ],
  },
];

// Statistics calculation
const stats = {
  modules: modules.length,
  routes: modules.reduce((acc, m) => acc + m.routes.length, 0),
  tabs: modules.reduce((acc, m) => acc + m.routes.reduce((a, r) => a + (r.tabs?.length || 0), 0), 0),
  authRoutes: modules.reduce((acc, m) => acc + m.routes.filter(r => r.authRequired !== 'none').length, 0),
  tokenRoutes: modules.reduce((acc, m) => acc + m.routes.filter(r => r.authRequired === 'token').length, 0),
};

// Auth badge component
const AuthBadge = ({ level }: { level: RouteInfo['authRequired'] }) => {
  const config = {
    none: { label: 'Öffentlich', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300', icon: Globe },
    user: { label: 'Benutzer', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', icon: User },
    admin: { label: 'Admin', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', icon: Shield },
    token: { label: 'Token', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300', icon: Key },
  }[level];
  
  const Icon = config.icon;
  
  return (
    <Badge variant="secondary" className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

// Stat card component
const StatCard = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Route card component
const RouteCard = ({ route, moduleColor, onClick }: { route: RouteInfo; moduleColor: string; onClick: () => void }) => (
  <div 
    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center gap-3 min-w-0">
      <code className="text-xs bg-muted px-2 py-1 rounded font-mono shrink-0">{route.path}</code>
      <span className="font-medium truncate">{route.name}</span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {route.tabs && route.tabs.length > 0 && (
        <Badge variant="outline" className="text-xs">
          <Layers className="h-3 w-3 mr-1" />
          {route.tabs.length} Tabs
        </Badge>
      )}
      <AuthBadge level={route.authRequired} />
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  </div>
);

export const SystemArchitectureDiagram = () => {
  const { t } = useTranslation();
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null);
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [authFilters, setAuthFilters] = useState<Record<string, boolean>>({
    none: true,
    user: true,
    admin: true,
    token: true,
  });

  // Filter modules and routes
  const filteredModules = useMemo(() => {
    return modules.map(module => ({
      ...module,
      routes: module.routes.filter(route => {
        const matchesSearch = searchTerm === '' || 
          route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.path.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAuth = authFilters[route.authRequired];
        return matchesSearch && matchesAuth;
      }),
    })).filter(module => module.routes.length > 0);
  }, [searchTerm, authFilters]);

  const handleRouteClick = (route: RouteInfo, module: ModuleInfo) => {
    setSelectedRoute(route);
    setSelectedModule(module);
  };

  const toggleAuthFilter = (key: string) => {
    setAuthFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Statistics Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Layers} label="Module" value={stats.modules} />
        <StatCard icon={Route} label="Routen" value={stats.routes} />
        <StatCard icon={LayoutDashboard} label="Tabs" value={stats.tabs} />
        <StatCard icon={Shield} label="Auth-geschützt" value={stats.authRoutes} />
        <StatCard icon={Zap} label="Token-basiert" value={stats.tokenRoutes} />
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Route oder Name suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Auth-Level filtern
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem 
              checked={authFilters.none} 
              onCheckedChange={() => toggleAuthFilter('none')}
            >
              <Globe className="mr-2 h-4 w-4" />
              Öffentlich
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={authFilters.user} 
              onCheckedChange={() => toggleAuthFilter('user')}
            >
              <User className="mr-2 h-4 w-4" />
              Benutzer
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={authFilters.admin} 
              onCheckedChange={() => toggleAuthFilter('admin')}
            >
              <Shield className="mr-2 h-4 w-4" />
              Admin
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem 
              checked={authFilters.token} 
              onCheckedChange={() => toggleAuthFilter('token')}
            >
              <Key className="mr-2 h-4 w-4" />
              Token
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Modules Accordion */}
      {filteredModules.length > 0 ? (
        <Accordion type="multiple" defaultValue={['main', 'b2b-supplier']} className="space-y-2">
          {filteredModules.map(module => {
            const Icon = module.icon;
            return (
              <AccordionItem key={module.id} value={module.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${module.colorClasses.bg}`}>
                      <Icon className={`h-5 w-5 ${module.colorClasses.text}`} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{module.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {module.routes.length} {module.routes.length === 1 ? 'Route' : 'Routen'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-normal">{module.description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-2 pt-2">
                    {module.routes.map(route => (
                      <RouteCard 
                        key={route.path} 
                        route={route} 
                        moduleColor={module.colorClasses.bg}
                        onClick={() => handleRouteClick(route, module)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Keine Routen gefunden</p>
          <p className="text-sm">Versuche andere Suchbegriffe oder Filter</p>
        </div>
      )}

      {/* Route Detail Sheet */}
      <Sheet open={!!selectedRoute} onOpenChange={() => setSelectedRoute(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              {selectedRoute?.name}
            </SheetTitle>
            <SheetDescription>
              <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                {selectedRoute?.path}
              </code>
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)] mt-6">
            <div className="space-y-6 pr-4">
              {/* Module Badge */}
              {selectedModule && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Modul</h4>
                  <Badge className={selectedModule.colorClasses.badge}>
                    <selectedModule.icon className="h-3 w-3 mr-1" />
                    {selectedModule.name}
                  </Badge>
                </div>
              )}

              {/* Auth Level */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Authentifizierung</h4>
                {selectedRoute && <AuthBadge level={selectedRoute.authRequired} />}
              </div>

              {/* Component */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Komponente</h4>
                <code className="text-sm bg-muted px-3 py-2 rounded font-mono block">
                  src/pages/{selectedRoute?.component}
                </code>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Beschreibung</h4>
                <p className="text-sm">{selectedRoute?.description}</p>
              </div>

              {/* Tabs */}
              {selectedRoute?.tabs && selectedRoute.tabs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Tabs ({selectedRoute.tabs.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedRoute.tabs.map(tab => (
                      <Badge key={tab} variant="secondary">{tab}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Features</h4>
                <ul className="space-y-2">
                  {selectedRoute?.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Open Route Button */}
              {selectedRoute && selectedRoute.authRequired !== 'token' && (
                <Button asChild className="w-full mt-4">
                  <Link to={selectedRoute.path}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Route öffnen
                  </Link>
                </Button>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};
