import { Package, ShoppingCart, BarChart3, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

const modules = [
  {
    icon: Package,
    name: 'KATALOG',
    description: 'Lieferanten & Artikel verwalten',
    features: ['Lieferanten anlegen', 'Artikel importieren (CSV, Excel)', 'KI-Foto-Erkennung', 'Kategorien & Einheiten'],
    color: 'bg-blue-500',
  },
  {
    icon: ShoppingCart,
    name: 'BESTELLUNGEN',
    description: 'Der komplette Bestellprozess',
    features: ['Warenkorb & Checkout', 'Bestellhistorie', 'Vorbestellungen', 'EasyOrder für Mitarbeiter'],
    color: 'bg-green-500',
  },
  {
    icon: BarChart3,
    name: 'BERICHTE',
    description: 'Daten und Analysen',
    features: ['Dashboard & KPIs', 'Ausgabenanalyse', 'Top-Lieferanten', 'Inventur'],
    color: 'bg-purple-500',
  },
  {
    icon: Settings,
    name: 'EINSTELLUNGEN',
    description: 'Anpassung & Verwaltung',
    features: ['Team & Rollen', 'Standorte & Adressen', 'E-Mail-Vorlagen', 'Lieferantenportal'],
    color: 'bg-orange-500',
  },
];

export const ModulesSection = () => {
  return (
    <section id="modules" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Die 4 Hauptmodule
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Alles, was Sie für Ihre Restaurant-Beschaffung brauchen
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {modules.map((module, index) => (
            <Card
              key={module.name}
              className="p-8 hover:shadow-xl transition-all duration-300 group animate-fade-in"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-xl ${module.color} text-white group-hover:scale-110 transition-transform`}>
                  <module.icon className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl text-foreground mb-2">
                    {module.name}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {module.description}
                  </p>
                  <ul className="space-y-2">
                    {module.features.map((feature) => (
                      <li key={feature} className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
