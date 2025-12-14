import { Building2, Smartphone, Link2, Globe, Camera, Wine, FileSpreadsheet, Rocket } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  {
    icon: Building2,
    name: 'Multi-Standort',
    description: 'Mehrere Restaurants zentral verwalten',
  },
  {
    icon: Smartphone,
    name: 'EasyOrder',
    description: 'Mitarbeiter bestellen per QR-Code – ohne Login',
  },
  {
    icon: Link2,
    name: 'Lieferantenportal',
    description: 'Lieferanten pflegen ihre Daten selbst',
  },
  {
    icon: Globe,
    name: '6 Sprachen',
    description: '🇩🇪 🇬🇧 🇫🇷 🇮🇹 🇹🇭 🇻🇳',
  },
  {
    icon: Camera,
    name: 'KI-Foto-Erkennung',
    description: 'Artikel per Foto erfassen – KI erkennt Produkt',
  },
  {
    icon: Wine,
    name: 'Weinkarte',
    description: 'Dedizierte Weinverwaltung mit KI-Recherche',
  },
  {
    icon: FileSpreadsheet,
    name: 'Export',
    description: 'PDF, Excel, CSV – alles exportierbar',
  },
  {
    icon: Rocket,
    name: 'Demo-Modus',
    description: '7 Tage kostenlos testen',
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Highlight-Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Was Bestellung.pro besonders macht
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={feature.name}
              className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mx-auto w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">
                {feature.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
