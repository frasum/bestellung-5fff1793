import { Clock, Wallet, Globe, Users, Mail, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';

const benefits = [
  {
    icon: Clock,
    title: 'Zeit sparen',
    description: 'Keine Excel-Listen, keine Zettelwirtschaft. Bestellen in Minuten statt Stunden.',
  },
  {
    icon: Wallet,
    title: 'Kosten senken',
    description: 'Ausgabenübersicht, Preishistorie, keine Doppelbestellungen mehr.',
  },
  {
    icon: Globe,
    title: 'Überall nutzbar',
    description: 'Cloud-basiert, auf jedem Gerät – Desktop, Tablet, Smartphone.',
  },
  {
    icon: Users,
    title: 'Team einbinden',
    description: 'Vom Koch bis zum Manager – jeder kann mitbestellen per QR-Code.',
  },
  {
    icon: Mail,
    title: 'Automatische E-Mails',
    description: 'Bestellungen gehen direkt an Lieferanten – mit einem Klick.',
  },
  {
    icon: Shield,
    title: 'Volle Kontrolle',
    description: 'Rollen & Rechte, Freigabeprozesse, Nachverfolgung.',
  },
];

export const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Warum Bestellung.pro?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Endlich Ordnung in Ihrer Gastronomie-Beschaffung
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <Card
              key={benefit.title}
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
