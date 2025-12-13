import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Datenschutz = () => {
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
            <CardTitle className="text-3xl">Datenschutzerklärung</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Datenschutz auf einen Blick</h2>
              <h3 className="text-lg font-medium mb-2">Allgemeine Hinweise</h3>
              <p className="text-muted-foreground">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen 
                Sie persönlich identifiziert werden können.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Verantwortliche Stelle</h2>
              <p className="text-muted-foreground">
                <strong>[Firmenname einfügen]</strong><br />
                [Straße und Hausnummer]<br />
                [PLZ] [Ort]<br />
                Deutschland<br /><br />
                Telefon: [Telefonnummer]<br />
                E-Mail: hello@bestellung.pro
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Datenerfassung auf dieser Website</h2>
              <h3 className="text-lg font-medium mb-2">Cookies</h3>
              <p className="text-muted-foreground">
                Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Endgerät 
                gespeichert werden und die Ihr Browser speichert. Die meisten der von uns verwendeten Cookies 
                sind sogenannte „Session-Cookies". Sie werden nach Ende Ihres Besuchs automatisch gelöscht.
              </p>
              
              <h3 className="text-lg font-medium mb-2 mt-4">Server-Log-Dateien</h3>
              <p className="text-muted-foreground">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in sogenannten Server-Log-Dateien, 
                die Ihr Browser automatisch an uns übermittelt. Dies sind: Browsertyp und Browserversion, verwendetes 
                Betriebssystem, Referrer URL, Hostname des zugreifenden Rechners, Uhrzeit der Serveranfrage, IP-Adresse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Registrierung und Nutzerkonto</h2>
              <p className="text-muted-foreground">
                Sie können sich auf unserer Website registrieren, um zusätzliche Funktionen auf der Seite zu nutzen. 
                Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder 
                Dienstes, für den Sie sich registriert haben.
              </p>
              <p className="text-muted-foreground mt-2">
                Die bei der Registrierung abgefragten Pflichtangaben müssen vollständig angegeben werden. Anderenfalls 
                werden wir die Registrierung ablehnen. Wir speichern: E-Mail-Adresse, Name, Organisationsname.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Bestelldaten</h2>
              <p className="text-muted-foreground">
                Für die Abwicklung von Bestellungen speichern wir: Lieferanteninformationen, Artikeldaten, 
                Bestellhistorie, Lieferadressen, Mitarbeiterdaten (soweit für EasyOrder erforderlich).
              </p>
              <p className="text-muted-foreground mt-2">
                Diese Daten werden ausschließlich zur Erfüllung des Vertrages zwischen Ihnen und uns sowie 
                zur Kommunikation mit Ihren Lieferanten verwendet.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. E-Mail-Versand</h2>
              <p className="text-muted-foreground">
                Wir nutzen den Dienst Resend für den Versand von E-Mails. Dies umfasst Bestellbenachrichtigungen 
                an Lieferanten, Team-Einladungen und Systembenachrichtigungen. Die E-Mail-Adressen der Empfänger 
                werden dabei an Resend übermittelt.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Ihre Rechte</h2>
              <p className="text-muted-foreground">
                Sie haben jederzeit das Recht:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Auskunft über Ihre bei uns gespeicherten Daten zu erhalten</li>
                <li>Die Berichtigung unrichtiger Daten zu verlangen</li>
                <li>Die Löschung Ihrer Daten zu verlangen</li>
                <li>Die Einschränkung der Datenverarbeitung zu verlangen</li>
                <li>Der Datenverarbeitung zu widersprechen</li>
                <li>Die Datenübertragbarkeit zu verlangen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Datensicherheit</h2>
              <p className="text-muted-foreground">
                Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) 
                in Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird. 
                Unsere Datenbank wird bei Supabase gehostet und entspricht den gängigen Sicherheitsstandards.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Auftragsverarbeitung</h2>
              <p className="text-muted-foreground">
                Wir haben mit folgenden Dienstleistern Auftragsverarbeitungsverträge (AVV) geschlossen:
              </p>
              <ul className="list-disc pl-6 text-muted-foreground">
                <li>Supabase (Datenbank-Hosting)</li>
                <li>Resend (E-Mail-Versand)</li>
                <li>Lovable (Hosting)</li>
              </ul>
            </section>

            <div className="pt-6 border-t text-sm text-muted-foreground">
              <p>Stand: Dezember 2025</p>
              <p className="mt-2 text-warning">
                ⚠️ Hinweis: Dies ist eine Platzhalter-Datenschutzerklärung. Bitte lassen Sie diese von einem 
                Rechtsanwalt prüfen und an Ihre spezifischen Geschäftspraktiken anpassen.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Datenschutz;
