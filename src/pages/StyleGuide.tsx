import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AlertCircle, CheckCircle, Info, Palette, ArrowLeft, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';

// Color swatch component
const ColorSwatch = ({ name, cssVar, className }: { name: string; cssVar: string; className: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className={`w-16 h-16 rounded-lg border shadow-sm ${className}`} />
    <div className="text-center">
      <p className="text-xs font-medium">{name}</p>
      <p className="text-xs text-muted-foreground">{cssVar}</p>
    </div>
  </div>
);

const StyleGuide = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  
  // Check if advanced settings is enabled
  const [hasAccess, setHasAccess] = useState(() => 
    localStorage.getItem('advanced-settings-enabled') === 'true'
  );

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'advanced-settings-enabled') {
        setHasAccess(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Zugang eingeschränkt</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Der Style-Guide ist nur mit aktivierten "Erweiterten Einstellungen" zugänglich.
            Aktiviere diese in den Einstellungen unter Profil.
          </p>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zu den Einstellungen
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6" />
              Style Guide
            </h1>
            <p className="text-muted-foreground mt-1">
              Alle UI-Komponenten und Design-Tokens auf einen Blick
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/settings')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </div>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Farb-Palette</CardTitle>
            <CardDescription>Semantische Farben des Design-Systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Primary Colors */}
              <div>
                <h4 className="text-sm font-medium mb-3">Primär-Farben</h4>
                <div className="flex flex-wrap gap-4">
                  <ColorSwatch name="Background" cssVar="--background" className="bg-background" />
                  <ColorSwatch name="Foreground" cssVar="--foreground" className="bg-foreground" />
                  <ColorSwatch name="Primary" cssVar="--primary" className="bg-primary" />
                  <ColorSwatch name="Secondary" cssVar="--secondary" className="bg-secondary" />
                  <ColorSwatch name="Accent" cssVar="--accent" className="bg-accent" />
                  <ColorSwatch name="Muted" cssVar="--muted" className="bg-muted" />
                </div>
              </div>

              {/* Status Colors */}
              <div>
                <h4 className="text-sm font-medium mb-3">Status-Farben</h4>
                <div className="flex flex-wrap gap-4">
                  <ColorSwatch name="Destructive" cssVar="--destructive" className="bg-destructive" />
                  <ColorSwatch name="Success" cssVar="--success" className="bg-green-500" />
                  <ColorSwatch name="Warning" cssVar="--warning" className="bg-amber-500" />
                  <ColorSwatch name="Info" cssVar="--info" className="bg-blue-500" />
                </div>
              </div>

              {/* UI Element Colors */}
              <div>
                <h4 className="text-sm font-medium mb-3">UI-Element-Farben</h4>
                <div className="flex flex-wrap gap-4">
                  <ColorSwatch name="Card" cssVar="--card" className="bg-card" />
                  <ColorSwatch name="Popover" cssVar="--popover" className="bg-popover" />
                  <ColorSwatch name="Border" cssVar="--border" className="bg-border" />
                  <ColorSwatch name="Input" cssVar="--input" className="bg-input" />
                  <ColorSwatch name="Ring" cssVar="--ring" className="bg-ring" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Alle Button-Varianten und Größen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Variants */}
            <div>
              <h4 className="text-sm font-medium mb-3">Varianten</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="hero">Hero</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h4 className="text-sm font-medium mb-3">Größen</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Sparkles className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h4 className="text-sm font-medium mb-3">Zustände</h4>
              <div className="flex flex-wrap gap-3">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button className="opacity-50 cursor-wait">Loading...</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status- und Label-Anzeigen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Inputs & Forms */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs & Formulare</CardTitle>
            <CardDescription>Formular-Elemente und Eingabefelder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Text Inputs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="input-normal">Normal Input</Label>
                <Input id="input-normal" placeholder="Placeholder text..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="input-disabled">Disabled Input</Label>
                <Input id="input-disabled" placeholder="Disabled..." disabled />
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <Label htmlFor="textarea">Textarea</Label>
              <Textarea id="textarea" placeholder="Mehrzeiliger Text..." />
            </div>

            {/* Toggles */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Toggle-Elemente</h4>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="switch" />
                  <Label htmlFor="switch">Switch</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="checkbox" />
                  <Label htmlFor="checkbox">Checkbox</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Container für gruppierte Inhalte</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Card Titel</CardTitle>
                  <CardDescription>Beschreibung der Card</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Card Content mit Beispieltext.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Aktion</Button>
                </CardFooter>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-lg">Highlighted Card</CardTitle>
                  <CardDescription>Mit Primary Border</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Hervorgehobene Card für wichtige Inhalte.</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Hinweis- und Warnmeldungen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                Standard-Information für den Benutzer.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>
                Etwas ist schief gelaufen. Bitte versuche es erneut.
              </AlertDescription>
            </Alert>

            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Erfolg</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Die Aktion wurde erfolgreich durchgeführt.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Dialogs & Sheets */}
        <Card>
          <CardHeader>
            <CardTitle>Dialoge & Sheets</CardTitle>
            <CardDescription>Modale Overlays und Sidepanels</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Dialog öffnen</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Titel</DialogTitle>
                  <DialogDescription>
                    Eine Beschreibung für den Dialog-Inhalt.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Dialog-Inhalt mit beliebigen Komponenten.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline">Abbrechen</Button>
                  <Button>Bestätigen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Sheet öffnen</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet Titel</SheetTitle>
                  <SheetDescription>
                    Seitliches Panel für zusätzliche Inhalte.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Sheet-Inhalt mit beliebigen Komponenten.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>

        {/* Animations */}
        <Card>
          <CardHeader>
            <CardTitle>Animationen</CardTitle>
            <CardDescription>Verfügbare Animation-Klassen (hover zum Testen)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 border rounded-lg text-center hover:animate-fade-in cursor-pointer">
                <p className="text-sm font-medium">animate-fade-in</p>
                <p className="text-xs text-muted-foreground">Hover to see</p>
              </div>
              <div className="p-4 border rounded-lg text-center hover:animate-scale-in cursor-pointer">
                <p className="text-sm font-medium">animate-scale-in</p>
                <p className="text-xs text-muted-foreground">Hover to see</p>
              </div>
              <div className="p-4 border rounded-lg text-center hover-scale cursor-pointer">
                <p className="text-sm font-medium">hover-scale</p>
                <p className="text-xs text-muted-foreground">Hover to see</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spacing Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Spacing-Referenz</CardTitle>
            <CardDescription>Standard-Abstände im Design-System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-primary rounded" />
                <span className="text-sm">gap-2 / p-2 (8px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-8 bg-primary rounded" />
                <span className="text-sm">gap-3 / p-3 (12px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-8 bg-primary rounded" />
                <span className="text-sm">gap-4 / p-4 (16px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-6 h-8 bg-primary rounded" />
                <span className="text-sm">gap-6 / p-6 (24px)</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary rounded" />
                <span className="text-sm">gap-8 / p-8 (32px)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <p className="text-center text-sm text-muted-foreground">
          Dokumentation: <code className="bg-muted px-1 py-0.5 rounded">DESIGN_TOKENS.md</code>
        </p>
      </div>
    </DashboardLayout>
  );
};

export default StyleGuide;
