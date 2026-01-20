import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  FileText, 
  Users, 
  BarChart3, 
  Settings, 
  ShoppingCart,
  Clock,
  DollarSign,
  Globe,
  UserPlus,
  Mail,
  Shield,
  MapPin,
  QrCode,
  ExternalLink,
  Languages,
  Camera,
  Wine,
  Download,
  Smartphone,
  Star,
  Receipt,
  Mic,
  Building2,
  TrendingUp,
  ClipboardCheck,
  FileSearch,
  Scan,
  Image,
  Brain,
  Sparkles,
  Package,
  Grape,
  BookOpen,
  Gamepad2,
  Warehouse,
  Calculator
} from 'lucide-react';
import { generateSystemOverviewPdf } from '@/lib/systemOverviewPdf';

type CopiedSection = string | null;

export default function SystemDescription() {
  const navigate = useNavigate();
  const [copiedSection, setCopiedSection] = useState<CopiedSection>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const copyToClipboard = async (text: string, sectionId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    toast({ title: 'In Zwischenablage kopiert', duration: 2000 });
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CopyButton = ({ text, sectionId }: { text: string; sectionId: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, sectionId)}
      className="h-8 px-2"
    >
      {copiedSection === sectionId ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateSystemOverviewPdf();
      toast({ title: 'PDF wurde heruntergeladen' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Content sections
  const intro = {
    title: 'Bestellung.pro – Digitale Beschaffung für Gastronomie',
    text: `Bestellung.pro ist eine moderne Cloud-Plattform für die digitale Beschaffung in Gastronomie und Hotellerie. 
Die Lösung digitalisiert den gesamten Bestellprozess – von der Artikelverwaltung bis zur automatischen E-Mail an Lieferanten.`
  };

  const benefits = [
    { icon: Clock, title: 'Zeit sparen', desc: 'Keine Excel-Listen, keine Zettelwirtschaft. Bestellen in Minuten statt Stunden.' },
    { icon: DollarSign, title: 'Kosten senken', desc: 'Ausgabenübersicht, Preishistorie, keine Doppelbestellungen mehr.' },
    { icon: Globe, title: 'Überall nutzbar', desc: 'Cloud-basiert, auf jedem Gerät – Desktop, Tablet, Smartphone.' },
    { icon: UserPlus, title: 'Team einbinden', desc: 'Vom Koch bis zum Manager – jeder kann mitbestellen per QR-Code.' },
    { icon: Mail, title: 'Automatische E-Mails', desc: 'Bestellungen gehen direkt an Lieferanten – mit einem Klick.' },
    { icon: Shield, title: 'Volle Kontrolle', desc: 'Rollen & Rechte, Freigabeprozesse, Nachverfolgung.' },
  ];

  const modules = [
    { 
      icon: FileText, 
      name: 'KATALOG', 
      color: 'bg-primary',
      features: ['Lieferanten & Artikel verwalten', 'KI-Foto-Import', 'CSV/Excel Import', 'Kategorien & Sortierung']
    },
    { 
      icon: ShoppingCart, 
      name: 'BESTELLUNGEN', 
      color: 'bg-emerald-500',
      features: ['Bestellhistorie', 'Vorbestellungen', 'EasyOrder für Mitarbeiter', 'Warenkorb-Drafts']
    },
    { 
      icon: BarChart3, 
      name: 'BERICHTE', 
      color: 'bg-amber-500',
      features: ['Dashboard & KPIs', 'Ausgabenanalyse', 'Inventur', 'Preisüberwachung']
    },
    { 
      icon: Settings, 
      name: 'EINSTELLUNGEN', 
      color: 'bg-slate-500',
      features: ['Team & Rollen', 'Standorte & Adressen', 'E-Mail-Vorlagen', 'Benachrichtigungen']
    },
  ];

  const internalRoles = [
    { role: 'Admin', desc: 'Vollzugriff: Lieferanten, Team, Berichte, Einstellungen' },
    { role: 'Manager', desc: 'Bestellungen freigeben, Inventur durchführen' },
    { role: 'Einkäufer', desc: 'Bestellen, Warenkorb verwalten' },
    { role: 'Betrachter', desc: 'Berichte ansehen (nur lesen)' },
  ];

  const externalUsers = [
    { group: 'Küchenpersonal', access: 'QR-Code (EasyOrder)', function: 'Einfache Bestellung per Smartphone' },
    { group: 'Lieferanten', access: 'Magic Link (Portal)', function: 'Artikel & Preise selbst pflegen' },
  ];

  const orderProcess = [
    { step: 1, title: 'Katalog durchsuchen', desc: 'Artikel nach Lieferant, Kategorie oder Name finden' },
    { step: 2, title: 'Warenkorb füllen', desc: 'Gewünschte Mengen eingeben und sammeln' },
    { step: 3, title: 'Checkout', desc: 'Lieferdatum und Adresse auswählen' },
    { step: 4, title: 'E-Mail senden', desc: 'Bestellungen gehen direkt an Lieferanten' },
    { step: 5, title: 'Bestätigung', desc: 'Lieferant bestätigt per Link in der E-Mail' },
  ];

  const highlights = [
    { icon: MapPin, name: 'Multi-Standort', desc: 'Mehrere Restaurants zentral verwalten' },
    { icon: QrCode, name: 'EasyOrder', desc: 'Mitarbeiter bestellen per QR-Code – ohne Login' },
    { icon: ExternalLink, name: 'Lieferantenportal', desc: 'Lieferanten pflegen ihre Daten selbst' },
    { icon: Languages, name: '6 Sprachen', desc: 'DE · EN · FR · IT · TH · VI' },
    { icon: Camera, name: 'KI-Foto-Erkennung', desc: 'Artikel per Foto erfassen – KI erkennt Produkt' },
    { icon: Wine, name: 'Weinkarte', desc: 'Dedizierte Weinverwaltung mit KI-Recherche' },
    { icon: Download, name: 'Export', desc: 'PDF, Excel, CSV – alles exportierbar' },
    { icon: Smartphone, name: 'Demo-Modus', desc: '7 Tage kostenlos testen' },
  ];

  // NEW: Invoice Processing
  const invoiceProcessing = {
    title: 'KI-Rechnungsverarbeitung',
    description: 'Automatische Analyse von Lieferantenrechnungen mit künstlicher Intelligenz. Das System erkennt Artikelpreise, gleicht sie mit Bestellungen ab und aktualisiert Ihre Stammdaten automatisch.',
    features: [
      { icon: FileSearch, name: 'PDF-Upload', desc: 'Rechnungen per Drag & Drop hochladen' },
      { icon: Brain, name: 'KI-Analyse', desc: 'Automatische Erkennung von Lieferant, Artikeln, Mengen und Preisen' },
      { icon: Sparkles, name: 'Auto-Erstellung', desc: 'Neue Lieferanten und Artikel werden automatisch angelegt' },
      { icon: TrendingUp, name: 'Preisabgleich', desc: 'Vergleich mit Bestellungen – Abweichungen werden markiert' },
      { icon: Mail, name: 'E-Mail-Integration', desc: 'Rechnungen direkt aus dem E-Mail-Postfach (IMAP) verarbeiten' },
      { icon: Receipt, name: 'Preishistorie', desc: 'Alle Preisänderungen werden automatisch protokolliert' },
    ]
  };

  // NEW: Voice Features
  const voiceFeatures = {
    title: 'Sprachsteuerung',
    description: 'Bestellungen und Inventur per Spracheingabe – freihändig und schnell. Unterstützt 6 Sprachen mit KI-basierter Transkription.',
    features: [
      { icon: Mic, name: 'Sprachbestellung', desc: 'Artikel per Sprache bestellen: "3 Kisten Mineralwasser"' },
      { icon: ClipboardCheck, name: 'Sprach-Inventur', desc: 'Bestände diktieren statt tippen' },
      { icon: Languages, name: 'Mehrsprachig', desc: 'Deutsch, Englisch, Französisch, Italienisch, Thai, Vietnamesisch' },
      { icon: Brain, name: 'KI-Erkennung', desc: 'Intelligente Zuordnung zu Ihrem Artikelkatalog' },
    ]
  };

  // NEW: B2B Portal
  const b2bPortal = {
    title: 'B2B-Lieferantenportal',
    description: 'Komplettes Bestellsystem für Lieferanten: Verwalten Sie Ihre Kunden, Artikel und Bestellungen – oder nutzen Sie das Portal für Ihren eigenen Einkauf bei Sublieferanten.',
    features: [
      { icon: Building2, name: 'Lieferanten-Dashboard', desc: 'Eigenes Portal für jeden Lieferanten' },
      { icon: UserPlus, name: 'Kunden einladen', desc: 'Geschäftskunden per E-Mail einladen' },
      { icon: Package, name: 'Artikelverwaltung', desc: 'Eigene Artikel und Preise pflegen' },
      { icon: FileText, name: 'Angebote erstellen', desc: 'PDF-Angebote direkt aus dem System' },
      { icon: Smartphone, name: 'Mobile Inventur', desc: 'Inventur per QR-Code auf dem Smartphone' },
      { icon: ShoppingCart, name: 'Eigener Einkauf', desc: 'Bestellungen bei eigenen Sublieferanten aufgeben' },
    ]
  };

  // NEW: Price Watch
  const priceWatch = {
    title: 'Preisüberwachung (Price Watch)',
    description: 'Automatische Suche nach günstigeren Preisen und Alternativen. Integration mit Großhandels-Katalogen für Preisvergleiche.',
    features: [
      { icon: TrendingUp, name: 'Preissuche', desc: 'Automatische Suche nach Alternativen im Web' },
      { icon: FileSearch, name: 'Kröswang-Integration', desc: 'Direkter Zugriff auf den Kröswang-Katalog' },
      { icon: Mail, name: 'Preisalarme', desc: 'E-Mail-Benachrichtigung bei Preisänderungen' },
      { icon: BarChart3, name: 'Vergleichsanalyse', desc: 'Übersichtliche Darstellung von Preisunterschieden' },
    ]
  };

  // NEW: Wine Features
  const wineFeatures = {
    title: 'Wein-Management',
    description: 'Spezialisierte Funktionen für die Weinverwaltung: KI-Recherche, mehrsprachige Beschreibungen und ein interaktives Quiz für Ihr Team.',
    features: [
      { icon: Wine, name: 'Weinkatalog', desc: 'Dedizierte Ansicht für Ihre Weinkarte' },
      { icon: Brain, name: 'KI-Weinrecherche', desc: 'Automatische Ermittlung von Rebsorte, Herkunft, Geschmacksprofil' },
      { icon: Image, name: 'Bildsuche', desc: 'Weinetiketten per Foto finden' },
      { icon: Languages, name: 'Übersetzung', desc: 'Automatische Übersetzung in 6 Sprachen' },
      { icon: BookOpen, name: 'PDF-Weinkarte', desc: 'Generierung einer druckfertigen Weinkarte mit QR-Codes' },
      { icon: Gamepad2, name: 'Wein-Quiz', desc: '"Wer wird Weinkenner?" – Schulungstool für Ihr Team' },
    ]
  };

  // NEW: Scan & Photo Features
  const scanFeatures = {
    title: 'KI-Foto & Scan-Funktionen',
    description: 'Erfassen Sie Artikel und Bestelllisten per Foto – die KI erkennt Produkte und ordnet sie automatisch Ihrem Katalog zu.',
    features: [
      { icon: Scan, name: 'Listen scannen', desc: 'Handschriftliche Bestelllisten abfotografieren' },
      { icon: Camera, name: 'Artikel erkennen', desc: 'Produktfotos für automatische Artikelanlage' },
      { icon: Brain, name: 'KI-Zuordnung', desc: 'Intelligente Zuordnung zu bestehenden Artikeln' },
      { icon: Sparkles, name: 'Vorschläge', desc: 'Foto-Vorschläge für fehlende Artikelbilder' },
    ]
  };

  // NEW: Inventory Features
  const inventoryFeatures = {
    title: 'Erweiterte Inventur',
    description: 'Digitale Inventur für alle Standorte mit Export-Funktionen, Warenwertkalkulation und Zeitvergleich.',
    features: [
      { icon: Warehouse, name: 'Mehrere Lager', desc: 'Getrennte Erfassung für Lager 1 und Lager 2' },
      { icon: MapPin, name: 'Multi-Standort', desc: 'Inventur pro Standort durchführen' },
      { icon: Download, name: 'Export', desc: 'PDF & Excel Export der Inventurliste' },
      { icon: Calculator, name: 'Warenwert', desc: 'Automatische Berechnung des Gesamtwarenwerts' },
      { icon: BarChart3, name: 'Zeitvergleich', desc: 'Vergleich zwischen verschiedenen Inventur-Zeitpunkten' },
      { icon: Mic, name: 'Spracheingabe', desc: 'Bestände per Sprache erfassen' },
    ]
  };

  const pricing = [
    { name: 'FREE', price: '0 €', features: ['1 Benutzer', '1 Standort', '50 Artikel', 'Basis-Funktionen'] },
    { name: 'BASIC', price: '29 €', features: ['3 Benutzer', '2 Standorte', '500 Artikel', 'E-Mail-Support'] },
    { name: 'PRO', price: '79 €', features: ['10 Benutzer', '5 Standorte', 'Unbegrenzte Artikel', 'EasyOrder & Portal', 'Prioritäts-Support'], highlighted: true },
    { name: 'ENTERPRISE', price: 'Auf Anfrage', features: ['Unbegrenzt', 'Unbegrenzt', 'SSO & API', 'Dedicated Support'] },
  ];

  const testimonials = [
    { quote: 'Endlich keine Excel-Listen mehr! Mein Team bestellt jetzt selbstständig per QR-Code.', author: 'Küchenchef, Restaurant München' },
    { quote: 'Die Ausgabenübersicht hat uns geholfen, 15% bei Lieferanten einzusparen.', author: 'Inhaber, Gasthaus Hamburg' },
    { quote: 'Meine Lieferanten pflegen ihre Preise jetzt selbst – weniger Telefonate, weniger Fehler.', author: 'F&B Manager, Hotel Berlin' },
  ];

  // Generate plain text for copying
  const generateSectionText = (sectionId: string): string => {
    switch (sectionId) {
      case 'intro':
        return `${intro.title}\n\n${intro.text}`;
      case 'benefits':
        return `Warum Bestellung.pro?\n\n${benefits.map(b => `• ${b.title}: ${b.desc}`).join('\n')}`;
      case 'modules':
        return `Die 4 Hauptmodule\n\n${modules.map(m => `${m.name}:\n${m.features.map(f => `  • ${f}`).join('\n')}`).join('\n\n')}`;
      case 'roles':
        return `Benutzergruppen & Rollen\n\nInterne Benutzer:\n${internalRoles.map(r => `• ${r.role}: ${r.desc}`).join('\n')}\n\nExterne Benutzer:\n${externalUsers.map(e => `• ${e.group} (${e.access}): ${e.function}`).join('\n')}`;
      case 'process':
        return `Der Bestellprozess\n\n${orderProcess.map(p => `${p.step}. ${p.title}: ${p.desc}`).join('\n')}`;
      case 'highlights':
        return `Highlight-Features\n\n${highlights.map(h => `• ${h.name}: ${h.desc}`).join('\n')}`;
      case 'invoiceProcessing':
        return `${invoiceProcessing.title}\n\n${invoiceProcessing.description}\n\n${invoiceProcessing.features.map(f => `• ${f.name}: ${f.desc}`).join('\n')}`;
      case 'voiceFeatures':
        return `${voiceFeatures.title}\n\n${voiceFeatures.description}\n\n${voiceFeatures.features.map(f => `• ${f.name}: ${f.desc}`).join('\n')}`;
      case 'b2bPortal':
        return `${b2bPortal.title}\n\n${b2bPortal.description}\n\n${b2bPortal.features.map(f => `• ${f.name}: ${f.desc}`).join('\n')}`;
      case 'priceWatch':
        return `${priceWatch.title}\n\n${priceWatch.description}\n\n${priceWatch.features.map(f => `• ${f.name}: ${f.desc}`).join('\n')}`;
      case 'wineFeatures':
        return `${wineFeatures.title}\n\n${wineFeatures.description}\n\n${wineFeatures.features.map(f => `• ${f.name}: ${f.desc}`).join('\n')}`;
      case 'scanFeatures':
        return `${scanFeatures.title}\n\n${scanFeatures.description}\n\n${scanFeatures.features.map(f => `• ${f.name}: ${f.desc}`).join('\n')}`;
      case 'inventoryFeatures':
        return `${inventoryFeatures.title}\n\n${inventoryFeatures.description}\n\n${inventoryFeatures.features.map(f => `• ${f.name}: ${f.desc}`).join('\n')}`;
      case 'pricing':
        return `Preise\n\n${pricing.map(p => `${p.name} (${p.price}/Monat):\n${p.features.map(f => `  • ${f}`).join('\n')}`).join('\n\n')}\n\nAlle Preise zzgl. MwSt.`;
      case 'testimonials':
        return `Kundenstimmen\n\n${testimonials.map(t => `"${t.quote}"\n— ${t.author}`).join('\n\n')}`;
      case 'all':
        return [
          generateSectionText('intro'),
          generateSectionText('benefits'),
          generateSectionText('modules'),
          generateSectionText('invoiceProcessing'),
          generateSectionText('voiceFeatures'),
          generateSectionText('b2bPortal'),
          generateSectionText('priceWatch'),
          generateSectionText('wineFeatures'),
          generateSectionText('scanFeatures'),
          generateSectionText('inventoryFeatures'),
          generateSectionText('roles'),
          generateSectionText('process'),
          generateSectionText('highlights'),
          generateSectionText('pricing'),
          generateSectionText('testimonials'),
        ].join('\n\n---\n\n');
      default:
        return '';
    }
  };

  // Render feature section helper
  const FeatureSection = ({ 
    sectionId, 
    title, 
    description, 
    features, 
    accentColor = 'bg-primary' 
  }: { 
    sectionId: string;
    title: string; 
    description: string; 
    features: Array<{ icon: React.ComponentType<{ className?: string }>; name: string; desc: string }>;
    accentColor?: string;
  }) => {
    const IconComponent = features[0]?.icon;
    return (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${accentColor}`}>
                {IconComponent && <IconComponent className="h-5 w-5 text-white" />}
              </div>
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{description}</p>
          </div>
          <CopyButton text={generateSectionText(sectionId)} sectionId={sectionId} />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => {
              const FeatureIcon = f.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`p-2 rounded-full ${accentColor}/10`}>
                    <FeatureIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{f.name}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Systembeschreibung</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(generateSectionText('all'), 'all')}
              className="gap-2"
            >
              {copiedSection === 'all' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Alles kopieren
            </Button>
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="gap-2">
              <FileText className="h-4 w-4" />
              {isGeneratingPdf ? 'Generiert...' : 'PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Intro */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle className="text-2xl text-primary">{intro.title}</CardTitle>
            <CopyButton text={generateSectionText('intro')} sectionId="intro" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">{intro.text}</p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Warum Bestellung.pro?</CardTitle>
            <CopyButton text={generateSectionText('benefits')} sectionId="benefits" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-full bg-primary/10">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{b.title}</h4>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modules */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Die 4 Hauptmodule</CardTitle>
            <CopyButton text={generateSectionText('modules')} sectionId="modules" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {modules.map((m, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${m.color}`}>
                      <m.icon className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-semibold">{m.name}</h4>
                  </div>
                  <ul className="space-y-1">
                    {m.features.map((f, fi) => (
                      <li key={fi} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NEW SECTIONS */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center pt-4">Erweiterte Funktionen</h2>
          
          <FeatureSection 
            sectionId="invoiceProcessing"
            title={invoiceProcessing.title}
            description={invoiceProcessing.description}
            features={invoiceProcessing.features}
            accentColor="bg-blue-500"
          />

          <FeatureSection 
            sectionId="voiceFeatures"
            title={voiceFeatures.title}
            description={voiceFeatures.description}
            features={voiceFeatures.features}
            accentColor="bg-violet-500"
          />

          <FeatureSection 
            sectionId="b2bPortal"
            title={b2bPortal.title}
            description={b2bPortal.description}
            features={b2bPortal.features}
            accentColor="bg-indigo-500"
          />

          <FeatureSection 
            sectionId="priceWatch"
            title={priceWatch.title}
            description={priceWatch.description}
            features={priceWatch.features}
            accentColor="bg-orange-500"
          />

          <FeatureSection 
            sectionId="wineFeatures"
            title={wineFeatures.title}
            description={wineFeatures.description}
            features={wineFeatures.features}
            accentColor="bg-rose-500"
          />

          <FeatureSection 
            sectionId="scanFeatures"
            title={scanFeatures.title}
            description={scanFeatures.description}
            features={scanFeatures.features}
            accentColor="bg-cyan-500"
          />

          <FeatureSection 
            sectionId="inventoryFeatures"
            title={inventoryFeatures.title}
            description={inventoryFeatures.description}
            features={inventoryFeatures.features}
            accentColor="bg-teal-500"
          />
        </div>

        {/* Roles */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Benutzergruppen & Rollen</CardTitle>
            <CopyButton text={generateSectionText('roles')} sectionId="roles" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Interne Benutzer</h4>
              <div className="space-y-2">
                {internalRoles.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                    <Badge variant="outline" className="w-24 justify-center">{r.role}</Badge>
                    <span className="text-sm text-muted-foreground">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Externe Benutzer</h4>
              <div className="space-y-2">
                {externalUsers.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                    <Badge variant="outline" className="w-28 justify-center">{e.group}</Badge>
                    <Badge variant="secondary" className="text-xs">{e.access}</Badge>
                    <span className="text-sm text-muted-foreground">{e.function}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Process */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Der Bestellprozess</CardTitle>
            <CopyButton text={generateSectionText('process')} sectionId="process" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderProcess.map((p, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    {p.step}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="font-medium">{p.title}</h4>
                    <p className="text-sm text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Highlights */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Highlight-Features</CardTitle>
            <CopyButton text={generateSectionText('highlights')} sectionId="highlights" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              {highlights.map((h, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/50 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <h.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h4 className="font-medium text-sm">{h.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{h.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Transparente Preise</CardTitle>
            <CopyButton text={generateSectionText('pricing')} sectionId="pricing" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {pricing.map((p, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-lg border-2 ${p.highlighted ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}
                >
                  {p.highlighted && (
                    <Badge className="mb-2 bg-amber-500">Empfohlen</Badge>
                  )}
                  <h4 className="font-bold">{p.name}</h4>
                  <div className="text-2xl font-bold text-primary my-2">
                    {p.price}
                    {p.name !== 'ENTERPRISE' && <span className="text-sm font-normal text-muted-foreground">/Monat</span>}
                  </div>
                  <ul className="space-y-1 text-sm">
                    {p.features.map((f, fi) => (
                      <li key={fi} className="text-muted-foreground">• {f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Alle Preise zzgl. MwSt. | Jährliche Zahlung günstiger
            </p>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>Was unsere Kunden sagen</CardTitle>
            <CopyButton text={generateSectionText('testimonials')} sectionId="testimonials" />
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {testimonials.map((t, i) => (
                <div key={i} className="p-4 rounded-lg bg-muted/50">
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm italic mb-3">"{t.quote}"</p>
                  <p className="text-xs text-muted-foreground">— {t.author}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-2">Jetzt kostenlos testen</h3>
            <p className="opacity-90 mb-4">7 Tage Demo-Zugang – keine Kreditkarte erforderlich</p>
            <Button 
              variant="secondary" 
              size="lg"
              onClick={() => navigate('/demo-suppliers')}
              className="gap-2"
            >
              <Smartphone className="h-5 w-5" />
              Demo starten
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
