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
  Star
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
      case 'pricing':
        return `Preise\n\n${pricing.map(p => `${p.name} (${p.price}/Monat):\n${p.features.map(f => `  • ${f}`).join('\n')}`).join('\n\n')}\n\nAlle Preise zzgl. MwSt.`;
      case 'testimonials':
        return `Kundenstimmen\n\n${testimonials.map(t => `"${t.quote}"\n— ${t.author}`).join('\n\n')}`;
      case 'all':
        return [
          generateSectionText('intro'),
          generateSectionText('benefits'),
          generateSectionText('modules'),
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
                  {i < orderProcess.length - 1 && (
                    <div className="absolute left-[19px] mt-8 w-0.5 h-8 bg-primary/20" />
                  )}
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
          <CardContent className="py-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Jetzt kostenlos testen</h3>
            <p className="opacity-90 mb-4">7 Tage kostenlos – keine Kreditkarte erforderlich</p>
            <Button variant="secondary" size="lg" onClick={() => navigate('/auth')}>
              Demo starten
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
