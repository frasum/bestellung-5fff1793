import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'FREE',
    price: '0',
    period: '/Monat',
    description: 'Zum Ausprobieren',
    features: ['1 Benutzer', '1 Standort', '50 Artikel', 'Basis-Funktionen'],
    highlighted: false,
  },
  {
    name: 'BASIC',
    price: '29',
    period: '/Monat',
    description: 'Für kleine Teams',
    features: ['3 Benutzer', '2 Standorte', '500 Artikel', 'E-Mail-Support', 'PDF Export'],
    highlighted: false,
  },
  {
    name: 'PRO',
    price: '79',
    period: '/Monat',
    description: 'Für wachsende Betriebe',
    features: ['10 Benutzer', '5 Standorte', 'Unbegrenzte Artikel', 'EasyOrder', 'Lieferantenportal', 'Prioritäts-Support'],
    highlighted: true,
  },
  {
    name: 'ENTERPRISE',
    price: 'Auf Anfrage',
    period: '',
    description: 'Für große Unternehmen',
    features: ['Unbegrenzte Benutzer', 'Unbegrenzte Standorte', 'SSO & API', 'Dedicated Support', 'SLA'],
    highlighted: false,
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Transparente Preise
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Wählen Sie das passende Paket für Ihr Unternehmen
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative p-6 flex flex-col animate-fade-in ${
                plan.highlighted
                  ? 'border-primary shadow-lg ring-2 ring-primary'
                  : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Beliebt
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="font-bold text-lg text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price === 'Auf Anfrage' ? '' : plan.price}
                  </span>
                  {plan.price !== 'Auf Anfrage' && (
                    <>
                      <span className="text-2xl font-bold text-foreground">€</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </>
                  )}
                  {plan.price === 'Auf Anfrage' && (
                    <span className="text-lg font-semibold text-foreground">Auf Anfrage</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
                onClick={() => navigate('/auth')}
              >
                {plan.price === 'Auf Anfrage' ? 'Kontaktieren' : 'Jetzt starten'}
              </Button>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Alle Preise zzgl. MwSt. | Bei jährlicher Zahlung 20% sparen
        </p>
      </div>
    </section>
  );
};
