import { Check, X, Sparkles, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "@/assets/logo.png";

interface PlanFeature {
  name: string;
  free: boolean | string;
  basic: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfekt zum Ausprobieren',
    features: [
      'Bis zu 5 Bestellungen/Monat',
      '2 Lieferanten',
      'Basis-Bestellverwaltung',
      'E-Mail-Benachrichtigungen',
      '30 Tage Bestellhistorie',
    ],
    limits: { orders: 5, suppliers: 2, users: 1 },
    cta: 'Kostenlos starten',
    variant: 'outline' as const,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9,
    description: 'Für kleine Restaurants',
    features: [
      'Bis zu 50 Bestellungen/Monat',
      '10 Lieferanten',
      'CSV/Excel Export',
      'Erweiterte Berichte',
      '1 Jahr Bestellhistorie',
      'E-Mail Support',
    ],
    limits: { orders: 50, suppliers: 10, users: 3 },
    cta: 'Basic wählen',
    variant: 'outline' as const,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    description: 'Für wachsende Betriebe',
    popular: true,
    features: [
      'Unbegrenzte Bestellungen',
      'Unbegrenzte Lieferanten',
      'EasyOrder Kiosk-Modus',
      'Team-Verwaltung mit Rollen',
      'Erweiterte Analysen',
      'Prioritäts-Support',
    ],
    limits: { orders: 'Unbegrenzt', suppliers: 'Unbegrenzt', users: 10 },
    cta: 'Pro wählen',
    variant: 'default' as const,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    description: 'Für Ketten & Franchise',
    features: [
      'Alles aus Pro',
      'API-Zugang',
      'Individuelle Integrationen',
      'Persönlicher Account Manager',
      'SLA-Garantie',
      'SSO / SAML',
    ],
    limits: { orders: 'Unbegrenzt', suppliers: 'Unbegrenzt', users: 'Unbegrenzt' },
    cta: 'Kontakt aufnehmen',
    variant: 'outline' as const,
  },
];

const featureComparison: PlanFeature[] = [
  { name: 'Bestellungen pro Monat', free: '5', basic: '50', pro: 'Unbegrenzt', enterprise: 'Unbegrenzt' },
  { name: 'Lieferanten', free: '2', basic: '10', pro: 'Unbegrenzt', enterprise: 'Unbegrenzt' },
  { name: 'Team-Mitglieder', free: '1', basic: '3', pro: '10', enterprise: 'Unbegrenzt' },
  { name: 'Bestellhistorie', free: '30 Tage', basic: '1 Jahr', pro: 'Unbegrenzt', enterprise: 'Unbegrenzt' },
  { name: 'E-Mail-Benachrichtigungen', free: true, basic: true, pro: true, enterprise: true },
  { name: 'CSV/Excel Export', free: false, basic: true, pro: true, enterprise: true },
  { name: 'PDF Export', free: false, basic: true, pro: true, enterprise: true },
  { name: 'Erweiterte Berichte', free: false, basic: true, pro: true, enterprise: true },
  { name: 'EasyOrder Kiosk-Modus', free: false, basic: false, pro: true, enterprise: true },
  { name: 'Spracheingabe', free: false, basic: false, pro: true, enterprise: true },
  { name: 'Multi-Standorte', free: false, basic: false, pro: true, enterprise: true },
  { name: 'Team-Rollen & Berechtigungen', free: false, basic: false, pro: true, enterprise: true },
  { name: 'Lieferanten-Portal', free: false, basic: false, pro: true, enterprise: true },
  { name: 'Inventur-Management', free: false, basic: false, pro: true, enterprise: true },
  { name: 'API-Zugang', free: false, basic: false, pro: false, enterprise: true },
  { name: 'Individuelle Integrationen', free: false, basic: false, pro: false, enterprise: true },
  { name: 'SSO / SAML', free: false, basic: false, pro: false, enterprise: true },
  { name: 'Persönlicher Account Manager', free: false, basic: false, pro: false, enterprise: true },
  { name: 'SLA-Garantie', free: false, basic: false, pro: false, enterprise: true },
  { name: 'Support', free: 'Community', basic: 'E-Mail', pro: 'Priorität', enterprise: 'Dediziert' },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSelectPlan = (planId: string) => {
    if (planId === 'enterprise') {
      window.location.href = 'mailto:hello@bestellung.pro?subject=Enterprise-Anfrage';
    } else {
      navigate('/auth');
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-success mx-auto" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Bestellung.pro" className="h-8 w-8" />
            <span className="font-semibold text-lg">Bestellung.pro</span>
          </button>
          <Button variant="outline" onClick={() => navigate('/auth')}>
            Anmelden
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="h-3 w-3 mr-1" />
          7 Tage kostenlos testen
        </Badge>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          Einfache, transparente Preise
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Wählen Sie den Plan, der zu Ihrem Restaurant passt. Keine versteckten Kosten, jederzeit kündbar.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg scale-105 z-10' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Beliebteste Wahl
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  {plan.price !== null ? (
                    <>
                      <span className="text-4xl font-bold">€{plan.price}</span>
                      <span className="text-muted-foreground">/Monat</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">Auf Anfrage</span>
                  )}
                </div>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  variant={plan.variant}
                  className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Alle Features im Vergleich</h2>
          <p className="text-muted-foreground">
            Detaillierte Übersicht aller Funktionen nach Plan
          </p>
        </div>
        <div className="max-w-6xl mx-auto overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Feature</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Basic</TableHead>
                <TableHead className="text-center bg-primary/5">
                  <div className="flex items-center justify-center gap-1">
                    Pro
                    <Badge variant="secondary" className="text-xs">Beliebt</Badge>
                  </div>
                </TableHead>
                <TableHead className="text-center">Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {featureComparison.map((feature, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{feature.name}</TableCell>
                  <TableCell className="text-center">{renderFeatureValue(feature.free)}</TableCell>
                  <TableCell className="text-center">{renderFeatureValue(feature.basic)}</TableCell>
                  <TableCell className="text-center bg-primary/5">{renderFeatureValue(feature.pro)}</TableCell>
                  <TableCell className="text-center">{renderFeatureValue(feature.enterprise)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 md:p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Bereit für die digitale Bestellung?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Starten Sie noch heute mit der kostenlosen Demo und erleben Sie, wie einfach Restaurant-Bestellungen sein können.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Kostenlos Demo starten
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.location.href = 'mailto:hello@bestellung.pro'}>
                Beratung anfordern
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Bestellung.pro" className="h-6 w-6" />
              <span className="text-sm text-muted-foreground">
                © 2025 Bestellung.pro. Alle Rechte vorbehalten.
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="/impressum" className="hover:text-foreground transition-colors">Impressum</a>
              <a href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</a>
              <a href="/agb" className="hover:text-foreground transition-colors">AGB</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
