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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AlertCircle, CheckCircle, Info, Palette, ArrowLeft, Sun, Moon, Sparkles, MoreHorizontal, ChevronDown, Settings, User, LogOut, HelpCircle, CalendarDays, ChevronsUpDown, Download, FileJson, FileCode, FileText, FlaskConical, Keyboard } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ComponentPlayground } from '@/components/style-guide/ComponentPlayground';

// Import extracted data and utilities
import {
  advancedFeatures,
  keyboardShortcuts,
  exportAsJSON,
  exportAsCSS,
  exportFullStyleGuidePDF,
} from './style-guide';

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
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Style Guide
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Design-System Dokumentation für Bestellung.pro
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Exportieren</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportFullStyleGuidePDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Gesamter Style Guide (PDF)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Design-Tokens</DropdownMenuLabel>
                <DropdownMenuItem onClick={exportAsJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Als JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsCSS}>
                  <FileCode className="h-4 w-4 mr-2" />
                  Als CSS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Advanced Features Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Erweiterte Features
            </CardTitle>
            <CardDescription>
              Alle Features die hinter dem "Erweiterte Einstellungen" Toggle versteckt sind
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {advancedFeatures.map((category, idx) => {
                const IconComponent = category.icon;
                return (
                  <AccordionItem key={idx} value={`category-${idx}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span>{category.category}</span>
                        <Badge variant="secondary" className="ml-2">
                          {category.features.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-7">
                        {category.features.map((feature, fIdx) => (
                          <div key={fIdx} className="flex flex-col gap-1 p-3 bg-muted/30 rounded-md">
                            <span className="font-medium text-sm">{feature.name}</span>
                            <span className="text-sm text-muted-foreground">{feature.description}</span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            
            <Separator className="my-6" />
            
            <div className="bg-muted/30 rounded-md p-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Wie aktivieren?
              </h4>
              <p className="text-sm text-muted-foreground">
                Gehe zu <strong>Einstellungen → Profil</strong> und aktiviere den Toggle "Erweiterte Einstellungen".
                Alle oben aufgeführten Features werden dann in der gesamten Anwendung sichtbar.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Tastatur-Shortcuts
            </CardTitle>
            <CardDescription>
              Alle verfügbaren Tastenkombinationen für schnelle Navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {keyboardShortcuts.map((category, idx) => {
                const IconComponent = category.icon;
                return (
                  <div key={idx}>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      {category.category}
                      <Badge variant="secondary" className="ml-1">
                        {category.shortcuts.length}
                      </Badge>
                    </h4>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="w-[140px]">Tastenkombination</TableHead>
                            <TableHead className="w-[120px]">Aktion</TableHead>
                            <TableHead>Beschreibung</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {category.shortcuts.map((shortcut, sIdx) => (
                            <TableRow key={sIdx}>
                              <TableCell>
                                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                  {shortcut.keys}
                                </kbd>
                              </TableCell>
                              <TableCell className="font-medium">{shortcut.action}</TableCell>
                              <TableCell className="text-muted-foreground">{shortcut.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Component Playground */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Component Playground
            </CardTitle>
            <CardDescription>
              Interaktiver Playground für alle UI-Komponenten mit Live-Code-Generierung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ComponentPlayground />
          </CardContent>
        </Card>

        {/* Design Tokens */}
        <Card>
          <CardHeader>
            <CardTitle>Design Tokens</CardTitle>
            <CardDescription>CSS-Variablen des ultraminimalistischen B2B SaaS Design-Systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Color Tokens */}
            <div>
              <h4 className="text-sm font-medium mb-3">Color Tokens (HSL)</h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>CSS Variable</TableHead>
                      <TableHead>HSL Value (Light)</TableHead>
                      <TableHead>HSL Value (Dark)</TableHead>
                      <TableHead className="w-[100px]">Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--background</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">210 20% 98%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">224 71% 4%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-background border" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--foreground</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">222 47% 11%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">213 31% 91%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-foreground" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--primary</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">217 91% 50%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">210 100% 52%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-primary" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--muted</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">210 20% 96%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">223 47% 14%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-muted border" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--border</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">220 13% 91%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">222 47% 18%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-border" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--destructive</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">0 84% 60%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">0 63% 45%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-destructive" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--warning</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">45 93% 47%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">45 93% 47%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-warning" /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-mono text-xs">--success</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">142 76% 36%</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">142 70% 45%</TableCell>
                      <TableCell><div className="w-8 h-8 rounded-md bg-success" /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Spacing Scale */}
            <div>
              <h4 className="text-sm font-medium mb-3">Spacing Scale</h4>
              <div className="flex flex-wrap gap-4">
                {[
                  { name: 'p-1', size: '4px' },
                  { name: 'p-2', size: '8px' },
                  { name: 'p-3', size: '12px' },
                  { name: 'p-4', size: '16px' },
                  { name: 'p-6', size: '24px' },
                  { name: 'p-8', size: '32px' },
                ].map((s) => (
                  <div key={s.name} className="flex flex-col items-center gap-1">
                    <div className={`bg-primary/20 border border-primary/30 ${s.name}`}>
                      <div className="w-8 h-8 bg-primary/50 rounded-sm" />
                    </div>
                    <span className="text-xs font-mono">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.size}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Border Radius */}
            <div>
              <h4 className="text-sm font-medium mb-3">Border Radius</h4>
              <p className="text-xs text-muted-foreground mb-4">Standard: <code className="bg-muted px-1 py-0.5 rounded">--radius: 0.375rem (6px)</code> - Ultraminimalistisch</p>
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-muted border border-border rounded-none" />
                  <span className="text-xs font-mono">rounded-none</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-muted border border-border rounded-sm" />
                  <span className="text-xs font-mono">rounded-sm</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-primary/10 border-2 border-primary rounded-md" />
                  <span className="text-xs font-mono font-semibold text-primary">rounded-md ✓</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-muted border border-border rounded-lg opacity-50" />
                  <span className="text-xs font-mono text-muted-foreground">rounded-lg</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-muted border border-border rounded-xl opacity-50" />
                  <span className="text-xs font-mono text-muted-foreground line-through">rounded-xl</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Principles */}
        <Card>
          <CardHeader>
            <CardTitle>Design-Prinzipien</CardTitle>
            <CardDescription>Ultraminimalistisches B2B SaaS Design-System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-muted/30 rounded-md border border-border">
                <h4 className="font-medium mb-2">Keine Schatten</h4>
                <p className="text-sm text-muted-foreground">Tiefe durch <code className="bg-muted px-1 rounded">border-border</code> statt shadow-* Klassen.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-md border border-border">
                <h4 className="font-medium mb-2">Konsistente Radii</h4>
                <p className="text-sm text-muted-foreground">Nur <code className="bg-muted px-1 rounded">rounded-md</code> (6px). Keine rounded-xl/2xl.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-md border border-border">
                <h4 className="font-medium mb-2">1 Primary Button</h4>
                <p className="text-sm text-muted-foreground">Maximal ein Primary-Button pro Screen. Rest: ghost/outline.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-md border border-border">
                <h4 className="font-medium mb-2">Dezente Backgrounds</h4>
                <p className="text-sm text-muted-foreground">Nutze <code className="bg-muted px-1 rounded">bg-muted/30</code> statt bg-primary/5.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-md border border-border">
                <h4 className="font-medium mb-2">Hover on Desktop</h4>
                <p className="text-sm text-muted-foreground">Actions bei Hover, immer sichtbar auf Mobile.</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-md border border-border">
                <h4 className="font-medium mb-2">Touch-optimiert</h4>
                <p className="text-sm text-muted-foreground">Min. <code className="bg-muted px-1 rounded">h-11</code> für Mobile-Buttons.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Farb-Palette</CardTitle>
            <CardDescription>Semantische Farben des Design-Systems</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
              <div>
                <h4 className="text-sm font-medium mb-3">Status-Farben</h4>
                <div className="flex flex-wrap gap-4">
                  <ColorSwatch name="Destructive" cssVar="--destructive" className="bg-destructive" />
                  <ColorSwatch name="Success" cssVar="--success" className="bg-success" />
                  <ColorSwatch name="Warning" cssVar="--warning" className="bg-warning" />
                  <ColorSwatch name="Info" cssVar="--info" className="bg-info" />
                </div>
              </div>
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
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="info">Info</Button>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Größen</h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Sparkles className="h-4 w-4" /></Button>
              </div>
            </div>
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

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typografie</CardTitle>
            <CardDescription>Schriftgrößen und Heading-Hierarchie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Headings</h4>
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-4xl</span>
                  <h1 className="text-4xl font-bold">Heading 1</h1>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-3xl</span>
                  <h2 className="text-3xl font-bold">Heading 2</h2>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-2xl</span>
                  <h3 className="text-2xl font-semibold">Heading 3</h3>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-xl</span>
                  <h4 className="text-xl font-semibold">Heading 4</h4>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-lg</span>
                  <h5 className="text-lg font-medium">Heading 5</h5>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-4">Body Text</h4>
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-base</span>
                  <p className="text-base">Standard body text (16px)</p>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-sm</span>
                  <p className="text-sm">Small text for labels (14px)</p>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-xs</span>
                  <p className="text-xs">Extra small for metadata (12px)</p>
                </div>
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
            <div className="space-y-2">
              <Label htmlFor="textarea">Textarea</Label>
              <Textarea id="textarea" placeholder="Mehrzeiliger Text..." />
            </div>
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
              <AlertDescription>Standard-Information für den Benutzer.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>Etwas ist schief gelaufen. Bitte versuche es erneut.</AlertDescription>
            </Alert>
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Erfolg</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">Die Aktion wurde erfolgreich durchgeführt.</AlertDescription>
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
                  <DialogDescription>Eine kurze Beschreibung des Dialogs.</DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">Dialog-Inhalt hier.</p>
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
                  <SheetDescription>Side-Panel für erweiterte Inhalte.</SheetDescription>
                </SheetHeader>
                <p className="text-sm text-muted-foreground mt-4">Sheet-Inhalt hier.</p>
              </SheetContent>
            </Sheet>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default StyleGuide;
