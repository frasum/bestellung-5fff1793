import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Download, 
  Image, 
  ExternalLink, 
  ZoomIn,
  Printer,
  FolderOpen
} from 'lucide-react';

interface Screenshot {
  id: string;
  name: string;
  filename: string;
  category: 'public' | 'app' | 'settings' | 'special' | 'documentation';
  description: string;
}

const screenshots: Screenshot[] = [
  // Public Pages
  { id: '01', name: 'Präsentation / Landing Page', filename: '01-presentation.png', category: 'public', description: 'Hauptseite mit Hero-Bereich und Produktübersicht' },
  { id: '02', name: 'Preise', filename: '02-pricing.png', category: 'public', description: 'Übersicht der Abonnement-Pläne und Features' },
  { id: '03', name: 'Login / Anmeldung', filename: '03-auth-login.png', category: 'public', description: 'Benutzer-Anmeldung und Registrierung' },
  // App Pages
  { id: '04', name: 'Einstellungen', filename: '04-settings.png', category: 'settings', description: 'Organisations- und Systemeinstellungen' },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  public: { label: 'Öffentlich', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  app: { label: 'Hauptanwendung', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  settings: { label: 'Einstellungen', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  special: { label: 'Spezialseiten', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  documentation: { label: 'Dokumentation', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' },
};

const Screenshots = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<Screenshot | null>(null);

  const handleDownload = (screenshot: Screenshot) => {
    const link = document.createElement('a');
    link.href = `/screenshots/${screenshot.filename}`;
    link.download = screenshot.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    screenshots.forEach((screenshot, index) => {
      setTimeout(() => {
        handleDownload(screenshot);
      }, index * 300); // Stagger downloads to prevent browser blocking
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const groupedScreenshots = screenshots.reduce((acc, screenshot) => {
    if (!acc[screenshot.category]) {
      acc[screenshot.category] = [];
    }
    acc[screenshot.category].push(screenshot);
    return acc;
  }, {} as Record<string, Screenshot[]>);

  return (
    <DashboardLayout>
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Screenshot-Galerie</h1>
              <p className="text-muted-foreground">
                Alle Systemseiten für Präsentation und Dokumentation
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Drucken
            </Button>
            <Button onClick={handleDownloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Alle herunterladen
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block">
          <h1 className="text-3xl font-bold text-center mb-2">Bestellung.pro - Screenshot-Dokumentation</h1>
          <p className="text-center text-muted-foreground">Generiert am {new Date().toLocaleDateString('de-DE')}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{screenshots.length}</div>
              <div className="text-sm text-muted-foreground">Screenshots</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">{groupedScreenshots.public?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Öffentliche Seiten</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{groupedScreenshots.app?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Hauptanwendung</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">{groupedScreenshots.settings?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Einstellungen</div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50 print:hidden">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Speicherort der Bilder</p>
                <p className="text-sm text-muted-foreground">
                  Alle Screenshots sind im Ordner <code className="bg-background px-1 py-0.5 rounded">/public/screenshots/</code> gespeichert.
                  Sie können die Bilder direkt herunterladen oder über den Datei-Explorer des Projekts zugreifen.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screenshot Categories */}
        {Object.entries(groupedScreenshots).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className={`px-2 py-1 rounded text-xs ${categoryLabels[category]?.color}`}>
                  {categoryLabels[category]?.label || category}
                </span>
                <span className="text-muted-foreground text-sm font-normal">
                  ({items.length} {items.length === 1 ? 'Bild' : 'Bilder'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
                {items.map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className="group relative border rounded-lg overflow-hidden bg-muted/30 hover:shadow-lg transition-shadow"
                  >
                    {/* Image */}
                    <div 
                      className="aspect-video relative cursor-pointer"
                      onClick={() => setSelectedImage(screenshot)}
                    >
                      <img
                        src={`/screenshots/${screenshot.filename}`}
                        alt={screenshot.name}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center print:hidden">
                        <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate">{screenshot.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {screenshot.description}
                      </p>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-3 print:hidden">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedImage(screenshot)}
                        >
                          <ZoomIn className="h-3 w-3 mr-1" />
                          Ansehen
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(screenshot)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {screenshots.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Image className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Screenshots vorhanden</h3>
              <p className="text-muted-foreground">
                Screenshots werden im Ordner <code>/public/screenshots/</code> gespeichert.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle className="text-base">Hinweise zur Verwendung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Einzelner Download:</strong> Klicken Sie auf den Download-Button unter jedem Bild.
            </p>
            <p>
              <strong>Alle herunterladen:</strong> Klicken Sie auf "Alle herunterladen" um alle Bilder nacheinander herunterzuladen.
            </p>
            <p>
              <strong>Drucken:</strong> Nutzen Sie die Druckfunktion für eine vollständige Dokumentation.
            </p>
            <p>
              <strong>Hinweis:</strong> Für geschützte Seiten (die eine Anmeldung erfordern) werden Sie gebeten, 
              sich anzumelden und manuell Screenshots zu erstellen, da diese nicht automatisch erfasst werden können.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedImage?.name}</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedImage && handleDownload(selectedImage)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Herunterladen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/screenshots/${selectedImage?.filename}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  In neuem Tab
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="mt-4 overflow-auto max-h-[70vh]">
              <img
                src={`/screenshots/${selectedImage.filename}`}
                alt={selectedImage.name}
                className="w-full h-auto rounded-lg"
              />
              <p className="mt-4 text-muted-foreground">{selectedImage.description}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Screenshots;
