import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Info, Database, Zap, Code, Shield, Mail, Bot, Users, Package, Wine, Key, Clock, FileText, Cog } from 'lucide-react';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Edge Functions data
const edgeFunctions = {
  orders: {
    title: "Bestellungen & E-Mail",
    icon: Mail,
    color: "text-blue-500",
    functions: [
      { name: "send-order-email", desc: "Bestellungen per E-Mail versenden", jwt: true },
      { name: "confirm-order", desc: "Bestellungen bestätigen", jwt: false },
      { name: "submit-simple-order", desc: "Simple Order einreichen", jwt: false },
      { name: "get-order-details", desc: "Bestelldetails abrufen", jwt: false },
      { name: "get-employee-drafts", desc: "Mitarbeiter-Entwürfe abrufen", jwt: false },
      { name: "update-employee-draft", desc: "Entwurf aktualisieren", jwt: false },
      { name: "delete-employee-draft", desc: "Entwurf löschen", jwt: false },
      { name: "notify-preorder-received", desc: "Vorbestellungsbenachrichtigung", jwt: true },
    ]
  },
  ai: {
    title: "KI & Automatisierung",
    icon: Bot,
    color: "text-purple-500",
    functions: [
      { name: "ai-import-helper", desc: "KI-gestützter Datenimport", jwt: true },
      { name: "transcribe-order", desc: "Sprachbestellung transkribieren", jwt: false },
      { name: "transcribe-inventory", desc: "Inventar-Spracheingabe", jwt: false },
      { name: "identify-article", desc: "Artikel per Foto erkennen", jwt: false },
      { name: "scan-order-list", desc: "Bestellliste scannen", jwt: false },
      { name: "parse-invoice", desc: "Rechnungen parsen", jwt: true },
      { name: "check-invoice-emails", desc: "Rechnungs-E-Mails prüfen", jwt: false },
    ]
  },
  wine: {
    title: "Wein-Features",
    icon: Wine,
    color: "text-rose-500",
    functions: [
      { name: "research-wine", desc: "Weinrecherche mit Perplexity", jwt: true },
      { name: "search-wine-image", desc: "Weinbilder suchen", jwt: true },
      { name: "translate-wine-content", desc: "Weininhalte übersetzen", jwt: true },
      { name: "import-wine-data", desc: "Weindaten importieren", jwt: true },
    ]
  },
  auth: {
    title: "Authentifizierung & Tokens",
    icon: Key,
    color: "text-yellow-500",
    functions: [
      { name: "verify-employee-login", desc: "Mitarbeiter-Login verifizieren", jwt: false },
      { name: "verify-employee-pin", desc: "PIN verifizieren", jwt: false },
      { name: "hash-employee-pin", desc: "PIN hashen", jwt: true },
      { name: "verify-supplier-token", desc: "Lieferanten-Token prüfen", jwt: false },
      { name: "verify-simple-order-token", desc: "Simple Order Token prüfen", jwt: false },
      { name: "verify-photo-capture-token", desc: "Foto-Token prüfen", jwt: false },
      { name: "verify-b2b-mobile-token", desc: "B2B Mobile Token prüfen", jwt: false },
      { name: "send-supplier-magic-link", desc: "Magic Link senden", jwt: true },
      { name: "request-new-magic-link", desc: "Neuen Magic Link anfordern", jwt: false },
      { name: "create-supplier-portal-token", desc: "Portal-Token erstellen", jwt: true },
    ]
  },
  b2b: {
    title: "B2B Portal",
    icon: Users,
    color: "text-green-500",
    functions: [
      { name: "send-b2b-offer", desc: "B2B-Angebot senden", jwt: true },
      { name: "submit-b2b-order", desc: "B2B-Bestellung einreichen", jwt: true },
      { name: "send-b2b-customer-invitation", desc: "Kundeneinladung senden", jwt: true },
      { name: "accept-b2b-customer-invitation", desc: "Einladung annehmen", jwt: false },
      { name: "send-b2b-customer-purchase-order", desc: "Kundenbestellung senden", jwt: true },
      { name: "send-b2b-purchase-order", desc: "Einkaufsbestellung senden", jwt: true },
      { name: "create-b2b-account-user", desc: "B2B-Account erstellen", jwt: true },
      { name: "update-b2b-account-email", desc: "E-Mail aktualisieren", jwt: true },
      { name: "reset-b2b-customer-password", desc: "Passwort zurücksetzen", jwt: false },
      { name: "upgrade-b2b-customer", desc: "Kunde upgraden", jwt: true },
      { name: "create-b2b-mobile-token", desc: "Mobile Token erstellen", jwt: true },
      { name: "manage-b2b-mobile-inventory", desc: "Mobile Inventar verwalten", jwt: false },
    ]
  },
  demo: {
    title: "Demo & Onboarding",
    icon: Package,
    color: "text-orange-500",
    functions: [
      { name: "create-demo-account", desc: "Demo-Account erstellen", jwt: false },
      { name: "convert-demo-account", desc: "Demo zu echtem Account", jwt: true },
      { name: "delete-demo-organization", desc: "Demo-Org löschen", jwt: true },
      { name: "populate-demo-data", desc: "Demo-Daten befüllen", jwt: true },
    ]
  },
  articles: {
    title: "Artikel & Fotos",
    icon: FileText,
    color: "text-cyan-500",
    functions: [
      { name: "create-article-from-mobile", desc: "Artikel mobil erstellen", jwt: false },
      { name: "create-articles-batch", desc: "Artikel batch erstellen", jwt: true },
      { name: "update-article-image", desc: "Artikelbild aktualisieren", jwt: true },
      { name: "create-photo-suggestion", desc: "Foto-Vorschlag erstellen", jwt: false },
      { name: "supplier-portal-articles", desc: "Portal-Artikel verwalten", jwt: false },
      { name: "manage-simple-order-favorites", desc: "Favoriten verwalten", jwt: false },
    ]
  },
  misc: {
    title: "Sonstige",
    icon: Cog,
    color: "text-gray-500",
    functions: [
      { name: "send-invitation-email", desc: "Einladungs-E-Mail senden", jwt: true },
      { name: "accept-invitation", desc: "Einladung annehmen", jwt: false },
      { name: "invite-sponsored-account", desc: "Gesponserten Account einladen", jwt: true },
      { name: "send-trial-reminders", desc: "Trial-Erinnerungen senden", jwt: false },
      { name: "send-price-alerts", desc: "Preisalarme senden", jwt: false },
      { name: "search-kroeswang-catalog", desc: "Kröswang-Katalog suchen", jwt: true },
      { name: "search-price-alternatives", desc: "Preisalternativen suchen", jwt: true },
      { name: "elevenlabs-conversation-token", desc: "Voice AI Token", jwt: true },
      { name: "elevenlabs-industry-token", desc: "Branchen-Voice Token", jwt: true },
    ]
  }
};

// Database Functions data
const databaseFunctions = {
  generators: {
    title: "Nummern-Generatoren",
    icon: Code,
    color: "text-blue-500",
    functions: [
      { name: "generate_order_number()", desc: "Generiert eindeutige Bestellnummern (ORD-YYYY-MM-XXXX)", returns: "TEXT" },
      { name: "generate_b2b_order_number()", desc: "Generiert B2B-Bestellnummern (B2B-YYYY-MM-XXXX)", returns: "TEXT" },
      { name: "generate_b2b_offer_number()", desc: "Generiert Angebotsnummern (ANG-YYYY-MM-XXXX)", returns: "TEXT" },
      { name: "generate_b2b_purchase_order_number()", desc: "Generiert Einkaufsbestellnummern (EK-YYYY-MM-XXXX)", returns: "TEXT" },
    ]
  },
  auth: {
    title: "Berechtigungsprüfung",
    icon: Shield,
    color: "text-yellow-500",
    functions: [
      { name: "has_role(_user_id, _role)", desc: "Prüft ob User eine bestimmte Rolle hat", returns: "BOOLEAN" },
      { name: "is_super_admin(_user_id)", desc: "Prüft ob User Super-Admin ist", returns: "BOOLEAN" },
      { name: "is_b2b_supplier_owner(user_id, account_id)", desc: "Prüft B2B-Supplier-Besitz", returns: "BOOLEAN" },
      { name: "is_b2b_supplier_user(user_id, supplier_id)", desc: "Prüft B2B-Supplier-Zugehörigkeit", returns: "BOOLEAN" },
      { name: "is_b2b_customer(user_id, account_id)", desc: "Prüft B2B-Kundenstatus", returns: "BOOLEAN" },
    ]
  },
  getters: {
    title: "ID-Getter",
    icon: Database,
    color: "text-green-500",
    functions: [
      { name: "get_user_organization_id(user_id)", desc: "Holt Organization-ID eines Users", returns: "UUID" },
      { name: "get_b2b_supplier_account_id(user_id)", desc: "Holt B2B-Supplier-Account-ID", returns: "UUID" },
      { name: "get_b2b_supplier_user_supplier_id(user_id)", desc: "Holt Supplier-ID eines B2B-Users", returns: "UUID" },
      { name: "get_b2b_customer_id(user_id)", desc: "Holt B2B-Kunden-ID", returns: "UUID" },
    ]
  },
  triggers: {
    title: "Trigger-Funktionen",
    icon: Zap,
    color: "text-purple-500",
    functions: [
      { name: "handle_new_user()", desc: "Erstellt Org, Profile und Rolle für neue User", returns: "TRIGGER" },
      { name: "update_updated_at_column()", desc: "Aktualisiert updated_at automatisch", returns: "TRIGGER" },
      { name: "notify_employee_on_order_confirmation()", desc: "Benachrichtigt Mitarbeiter bei Bestellbestätigung", returns: "TRIGGER" },
      { name: "remove_team_member(member_user_id)", desc: "Entfernt Teammitglied sicher", returns: "VOID" },
    ]
  },
  cleanup: {
    title: "Cleanup-Funktionen",
    icon: Clock,
    color: "text-red-500",
    functions: [
      { name: "cleanup_old_rate_limits()", desc: "Löscht alte Demo-Rate-Limits (>24h)", returns: "VOID" },
      { name: "cleanup_simple_order_rate_limits()", desc: "Löscht Simple-Order-Rate-Limits (>1h)", returns: "VOID" },
      { name: "cleanup_old_magic_link_rate_limits()", desc: "Löscht Magic-Link-Rate-Limits (>1h)", returns: "VOID" },
      { name: "cleanup_pin_verification_rate_limits()", desc: "Löscht PIN-Rate-Limits (>15min)", returns: "VOID" },
      { name: "cleanup_expired_employee_sessions()", desc: "Löscht abgelaufene Sessions", returns: "VOID" },
    ]
  }
};

// Mermaid diagram definition
const mermaidDiagram = `
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#3b82f6', 'primaryTextColor': '#fff', 'primaryBorderColor': '#1d4ed8', 'lineColor': '#6b7280', 'secondaryColor': '#10b981', 'tertiaryColor': '#f59e0b' }}}%%
flowchart TB
  subgraph EdgeFunctions["⚡ Edge Functions (35)"]
    direction TB
    subgraph Orders["📧 Bestellungen"]
      EF1["send-order-email"]
      EF2["confirm-order"]
      EF3["submit-simple-order"]
    end
    subgraph AI["🤖 KI & Automatisierung"]
      EF4["ai-import-helper"]
      EF5["transcribe-order"]
      EF6["identify-article"]
    end
    subgraph B2B["👥 B2B Portal"]
      EF7["send-b2b-offer"]
      EF8["submit-b2b-order"]
      EF9["send-b2b-customer-invitation"]
    end
    subgraph Auth["🔐 Authentifizierung"]
      EF10["verify-employee-pin"]
      EF11["verify-supplier-token"]
      EF12["hash-employee-pin"]
    end
    subgraph Wine["🍷 Wein"]
      EF13["research-wine"]
      EF14["translate-wine-content"]
    end
  end

  subgraph DatabaseFunctions["🗄️ Database Functions (17)"]
    direction TB
    subgraph Generators["📝 Generatoren"]
      DF1["generate_order_number()"]
      DF2["generate_b2b_order_number()"]
    end
    subgraph Permissions["🛡️ Berechtigungen"]
      DF3["has_role()"]
      DF4["is_super_admin()"]
      DF5["is_b2b_supplier_owner()"]
    end
    subgraph Getters["🔍 ID-Getter"]
      DF6["get_user_organization_id()"]
      DF7["get_b2b_customer_id()"]
    end
    subgraph Triggers["⚡ Trigger"]
      DF8["handle_new_user()"]
      DF9["update_updated_at_column()"]
    end
    subgraph Cleanup["🧹 Cleanup"]
      DF10["cleanup_old_rate_limits()"]
      DF11["cleanup_expired_employee_sessions()"]
    end
  end

  subgraph External["🌐 Externe Dienste"]
    SMTP["📧 SMTP Server"]
    OpenAI["🤖 OpenAI"]
    Perplexity["🔍 Perplexity"]
    ElevenLabs["🎤 ElevenLabs"]
  end

  subgraph Database["🗄️ PostgreSQL"]
    Tables["50+ Tabellen"]
    RLS["Row Level Security"]
  end

  EdgeFunctions --> External
  EdgeFunctions --> Database
  DatabaseFunctions --> Database
  
  EF1 --> SMTP
  EF4 --> OpenAI
  EF5 --> OpenAI
  EF13 --> Perplexity
`;

export const FunctionsOverviewDiagram = () => {
  const { t } = useTranslation();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [selectedTab, setSelectedTab] = useState('diagram');
  const [detailSheet, setDetailSheet] = useState<{
    open: boolean;
    type: 'edge' | 'database';
    category: string;
    data: any;
  }>({ open: false, type: 'edge', category: '', data: null });

  useEffect(() => {
    const renderDiagram = async () => {
      if (mermaidRef.current) {
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#1d4ed8',
            lineColor: '#6b7280',
            secondaryColor: '#10b981',
            tertiaryColor: '#f59e0b',
            background: '#1f2937',
            mainBkg: '#1f2937',
            nodeBorder: '#374151',
            clusterBkg: '#111827',
            clusterBorder: '#374151',
            titleColor: '#f3f4f6',
            edgeLabelBackground: '#374151',
          },
          flowchart: {
            curve: 'basis',
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 80,
            htmlLabels: true,
          },
          securityLevel: 'loose',
        });

        try {
          mermaidRef.current.innerHTML = '';
          const { svg } = await mermaid.render('functions-diagram', mermaidDiagram);
          mermaidRef.current.innerHTML = svg;
          setIsRendered(true);
        } catch (error) {
          console.error('Mermaid rendering error:', error);
        }
      }
    };

    if (selectedTab === 'diagram') {
      renderDiagram();
    }
  }, [selectedTab]);

  const exportToPDF = useCallback(async () => {
    if (!mermaidRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = mermaidRef.current.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx?.scale(2, 2);
        ctx?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);

        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2],
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save('functions-overview.pdf');
        setIsExporting(false);
      };

      img.src = url;
    } catch (error) {
      console.error('PDF export error:', error);
      setIsExporting(false);
    }
  }, []);

  const openCategoryDetail = (type: 'edge' | 'database', category: string, data: any) => {
    setDetailSheet({ open: true, type, category, data });
  };

  const totalEdgeFunctions = Object.values(edgeFunctions).reduce((acc, cat) => acc + cat.functions.length, 0);
  const totalDbFunctions = Object.values(databaseFunctions).reduce((acc, cat) => acc + cat.functions.length, 0);
  const publicEdgeFunctions = Object.values(edgeFunctions).reduce(
    (acc, cat) => acc + cat.functions.filter(f => !f.jwt).length, 0
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Funktions-Übersicht</h1>
          <p className="text-muted-foreground mt-1">
            Alle Edge Functions und Database Functions im System
          </p>
        </div>
        <Button onClick={exportToPDF} disabled={isExporting || !isRendered} variant="outline">
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Als PDF exportieren
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-blue-500">{totalEdgeFunctions}</CardTitle>
            <CardDescription>Edge Functions</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-500">{totalDbFunctions}</CardTitle>
            <CardDescription>Database Functions</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-yellow-500">{publicEdgeFunctions}</CardTitle>
            <CardDescription>Öffentliche Endpoints</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-purple-500">{totalEdgeFunctions - publicEdgeFunctions}</CardTitle>
            <CardDescription>JWT-geschützt</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="diagram">
            <Zap className="h-4 w-4 mr-2" />
            Diagramm
          </TabsTrigger>
          <TabsTrigger value="edge">
            <Code className="h-4 w-4 mr-2" />
            Edge Functions
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database Functions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagram" className="mt-6">
          <Card>
            <CardContent className="p-4">
              <div
                ref={mermaidRef}
                className="w-full overflow-auto bg-gray-900 rounded-lg p-4 min-h-[600px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edge" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(edgeFunctions).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => openCategoryDetail('edge', key, category)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${category.color}`} />
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription>{category.functions.length} Funktionen</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {category.functions.slice(0, 3).map((fn) => (
                        <Badge key={fn.name} variant="secondary" className="text-xs">
                          {fn.name}
                        </Badge>
                      ))}
                      {category.functions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.functions.length - 3} mehr
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(databaseFunctions).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <Card
                  key={key}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => openCategoryDetail('database', key, category)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${category.color}`} />
                      <div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription>{category.functions.length} Funktionen</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {category.functions.slice(0, 2).map((fn) => (
                        <Badge key={fn.name} variant="secondary" className="text-xs font-mono">
                          {fn.name}
                        </Badge>
                      ))}
                      {category.functions.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.functions.length - 2} mehr
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={detailSheet.open} onOpenChange={(open) => setDetailSheet(prev => ({ ...prev, open }))}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {detailSheet.data?.icon && <detailSheet.data.icon className={`h-5 w-5 ${detailSheet.data?.color}`} />}
              {detailSheet.data?.title}
            </SheetTitle>
            <SheetDescription>
              {detailSheet.type === 'edge' ? 'Edge Function Kategorie' : 'Database Function Kategorie'}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
            <div className="space-y-3">
              {detailSheet.data?.functions?.map((fn: any) => (
                <Card key={fn.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-mono">{fn.name}</CardTitle>
                      {detailSheet.type === 'edge' && (
                        <Badge variant={fn.jwt ? 'default' : 'secondary'} className="text-xs">
                          {fn.jwt ? '🔒 JWT' : '🌐 Public'}
                        </Badge>
                      )}
                      {detailSheet.type === 'database' && fn.returns && (
                        <Badge variant="outline" className="text-xs font-mono">
                          → {fn.returns}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{fn.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};
