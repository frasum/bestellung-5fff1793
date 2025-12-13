import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const AGB = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Bestellung.pro" className="h-8 w-8" />
            <span className="font-semibold text-lg">Bestellung.pro</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">§ 1 Geltungsbereich</h2>
              <p className="text-muted-foreground">
                (1) Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge über die Nutzung der 
                SaaS-Plattform „Bestellung.pro" (nachfolgend „Dienst") zwischen [Firmenname] (nachfolgend „Anbieter") 
                und dem Kunden (nachfolgend „Nutzer").
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Abweichende Geschäftsbedingungen des Nutzers werden nicht anerkannt, es sei denn, der Anbieter 
                stimmt ihrer Geltung ausdrücklich schriftlich zu.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 2 Leistungsbeschreibung</h2>
              <p className="text-muted-foreground">
                (1) Der Anbieter stellt dem Nutzer eine webbasierte Software zur Verwaltung von Restaurant-Bestellungen 
                bei Lieferanten zur Verfügung. Der Funktionsumfang richtet sich nach dem gewählten Tarif.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Die verfügbaren Tarife sind: Free, Basic, Pro und Enterprise. Die jeweiligen Leistungsmerkmale 
                und Beschränkungen sind auf der Preisseite unter /pricing einsehbar.
              </p>
              <p className="text-muted-foreground mt-2">
                (3) Der Anbieter behält sich vor, den Dienst jederzeit zu aktualisieren und weiterzuentwickeln, 
                solange die wesentlichen Funktionen erhalten bleiben.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 3 Vertragsschluss und Registrierung</h2>
              <p className="text-muted-foreground">
                (1) Die Registrierung für den Dienst stellt ein Angebot des Nutzers auf Abschluss eines Nutzungsvertrages dar.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Der Vertrag kommt durch die Aktivierung des Nutzerkontos durch den Anbieter zustande.
              </p>
              <p className="text-muted-foreground mt-2">
                (3) Der Nutzer ist verpflichtet, wahrheitsgemäße und vollständige Angaben bei der Registrierung zu machen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 4 Nutzungsentgelt und Zahlung</h2>
              <p className="text-muted-foreground">
                (1) Die Höhe des monatlichen Nutzungsentgelts richtet sich nach dem gewählten Tarif.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Das Nutzungsentgelt ist monatlich im Voraus zu zahlen.
              </p>
              <p className="text-muted-foreground mt-2">
                (3) Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang zum Dienst zu sperren.
              </p>
              <p className="text-muted-foreground mt-2">
                (4) Der Free-Tarif ist kostenlos und kann mit eingeschränktem Funktionsumfang dauerhaft genutzt werden.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 5 Nutzungsumfang und -beschränkungen</h2>
              <p className="text-muted-foreground">
                (1) Je nach gewähltem Tarif gelten folgende Beschränkungen:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Free: 5 Bestellungen/Monat, 2 Lieferanten, 1 Benutzer</li>
                <li>Basic: 50 Bestellungen/Monat, 10 Lieferanten, 3 Benutzer</li>
                <li>Pro: Unbegrenzte Bestellungen und Lieferanten, 10 Benutzer</li>
                <li>Enterprise: Unbegrenzte Nutzung nach individueller Vereinbarung</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                (2) Bei Überschreitung der Limits wird der Nutzer benachrichtigt und zum Upgrade aufgefordert.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 6 Verfügbarkeit und Support</h2>
              <p className="text-muted-foreground">
                (1) Der Anbieter bemüht sich um eine Verfügbarkeit des Dienstes von 99% im Jahresmittel.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Geplante Wartungsarbeiten werden nach Möglichkeit vorab angekündigt.
              </p>
              <p className="text-muted-foreground mt-2">
                (3) Support wird entsprechend dem gewählten Tarif bereitgestellt (Community, E-Mail, Priorität, Dediziert).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 7 Datenschutz und Datensicherheit</h2>
              <p className="text-muted-foreground">
                (1) Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung und den 
                anwendbaren Datenschutzgesetzen.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Der Nutzer bleibt Eigentümer seiner Daten und kann diese jederzeit exportieren oder löschen lassen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 8 Vertragslaufzeit und Kündigung</h2>
              <p className="text-muted-foreground">
                (1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Seiten mit einer Frist 
                von 30 Tagen zum Monatsende gekündigt werden.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
              </p>
              <p className="text-muted-foreground mt-2">
                (3) Nach Kündigung werden die Daten des Nutzers nach 30 Tagen gelöscht, sofern keine gesetzlichen 
                Aufbewahrungspflichten entgegenstehen.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 9 Haftung</h2>
              <p className="text-muted-foreground">
                (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Für leichte Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten, 
                begrenzt auf den vertragstypischen, vorhersehbaren Schaden.
              </p>
              <p className="text-muted-foreground mt-2">
                (3) Die Haftung für Datenverlust wird auf den typischen Wiederherstellungsaufwand beschränkt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 10 Schlussbestimmungen</h2>
              <p className="text-muted-foreground">
                (1) Es gilt das Recht der Bundesrepublik Deutschland.
              </p>
              <p className="text-muted-foreground mt-2">
                (2) Gerichtsstand ist [Ort], sofern der Nutzer Kaufmann ist.
              </p>
              <p className="text-muted-foreground mt-2">
                (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen 
                Bestimmungen unberührt.
              </p>
            </section>

            <div className="pt-6 border-t text-sm text-muted-foreground">
              <p>Stand: Dezember 2025</p>
              <p className="mt-2 text-warning">
                ⚠️ Hinweis: Dies sind Platzhalter-AGB. Bitte lassen Sie diese von einem Rechtsanwalt prüfen 
                und an Ihre spezifischen Geschäftspraktiken anpassen.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AGB;
