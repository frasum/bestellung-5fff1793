import { useState } from 'react';
import { Crown, ClipboardList, ShoppingCart, Eye, QrCode, Link2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const internalRoles = [
  {
    icon: Crown,
    name: 'Admin',
    description: 'Vollzugriff auf alle Funktionen',
    permissions: ['Lieferanten & Artikel verwalten', 'Team & Rollen', 'Alle Berichte', 'Einstellungen'],
    color: 'text-amber-500',
  },
  {
    icon: ClipboardList,
    name: 'Manager',
    description: 'Bestellungen freigeben und überwachen',
    permissions: ['Bestellungen freigeben', 'Inventur durchführen', 'Berichte einsehen', 'Artikel bearbeiten'],
    color: 'text-blue-500',
  },
  {
    icon: ShoppingCart,
    name: 'Einkäufer',
    description: 'Tägliche Bestellungen aufgeben',
    permissions: ['Warenkorb verwalten', 'Bestellungen aufgeben', 'Katalog durchsuchen'],
    color: 'text-green-500',
  },
  {
    icon: Eye,
    name: 'Betrachter',
    description: 'Nur Lesezugriff',
    permissions: ['Berichte ansehen', 'Bestellhistorie einsehen'],
    color: 'text-slate-500',
  },
];

const externalRoles = [
  {
    icon: QrCode,
    name: 'Küchenpersonal',
    access: 'QR-Code (EasyOrder)',
    description: 'Einfache Bestellung per Smartphone',
    features: ['Kein Login erforderlich', 'Artikel auswählen', 'Mengen eingeben', 'Vorbestellung abschicken'],
    color: 'text-teal-500',
  },
  {
    icon: Link2,
    name: 'Lieferanten',
    access: 'Magic Link (Portal)',
    description: 'Artikel & Preise selbst pflegen',
    features: ['Preise aktualisieren', 'Neue Artikel vorschlagen', 'Bestellungen einsehen', 'Kontaktdaten pflegen'],
    color: 'text-violet-500',
  },
];

export const RolesSection = () => {
  const [activeTab, setActiveTab] = useState('internal');

  return (
    <section id="roles" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Benutzergruppen & Rollen
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Flexible Rechteverwaltung für Ihr gesamtes Team
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="internal" className="text-base py-3">
              Interne Benutzer
            </TabsTrigger>
            <TabsTrigger value="external" className="text-base py-3">
              Externe Benutzer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="internal" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {internalRoles.map((role, index) => (
                <Card
                  key={role.name}
                  className="p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-muted ${role.color}`}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {role.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {role.description}
                      </p>
                      <ul className="space-y-1">
                        {role.permissions.map((perm) => (
                          <li key={perm} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="text-success">✓</span>
                            {perm}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="external" className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {externalRoles.map((role, index) => (
                <Card
                  key={role.name}
                  className="p-6 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-muted ${role.color}`}>
                      <role.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {role.name}
                      </h3>
                      <p className="text-xs text-primary font-medium mb-2">
                        Zugang: {role.access}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {role.description}
                      </p>
                      <ul className="space-y-1">
                        {role.features.map((feat) => (
                          <li key={feat} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="text-success">✓</span>
                            {feat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
