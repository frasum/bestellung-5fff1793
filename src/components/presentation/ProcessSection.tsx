import { Search, ShoppingCart, CreditCard, Mail, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    number: 1,
    title: 'Katalog durchsuchen',
    description: 'Artikel nach Lieferant, Kategorie oder Name finden',
  },
  {
    icon: ShoppingCart,
    number: 2,
    title: 'Warenkorb füllen',
    description: 'Gewünschte Mengen eingeben und sammeln',
  },
  {
    icon: CreditCard,
    number: 3,
    title: 'Checkout',
    description: 'Lieferdatum, Zeitfenster und Adresse auswählen',
  },
  {
    icon: Mail,
    number: 4,
    title: 'E-Mail senden',
    description: 'Bestellungen gehen direkt an Lieferanten',
  },
  {
    icon: CheckCircle,
    number: 5,
    title: 'Bestätigung',
    description: 'Lieferant bestätigt per Link in der E-Mail',
  },
];

export const ProcessSection = () => {
  return (
    <section id="process" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Der Bestellprozess
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            In 5 einfachen Schritten zur Bestellung
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className="relative flex items-start gap-6 animate-fade-in"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Step number circle */}
                  <div className="relative z-10 flex-shrink-0 w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <step.icon className="h-7 w-7 text-primary-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Schritt {step.number}
                      </span>
                      <h3 className="font-semibold text-lg text-foreground">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final result */}
          <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="inline-flex items-center gap-3 bg-success/10 text-success px-6 py-3 rounded-full">
              <CheckCircle className="h-6 w-6" />
              <span className="font-semibold">Bestellung abgeschlossen & nachverfolgbar</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
