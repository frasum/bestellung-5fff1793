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
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { AlertCircle, CheckCircle, Info, Palette, ArrowLeft, Sun, Moon, Sparkles, MoreHorizontal, ChevronDown, Settings, User, LogOut, HelpCircle, CalendarDays, ChevronsUpDown, Download, FileJson, FileCode } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

// Design tokens data for export
const designTokens = {
  colors: {
    light: {
      background: "210 20% 98%",
      foreground: "222 47% 11%",
      card: "0 0% 100%",
      cardForeground: "222 47% 11%",
      popover: "0 0% 100%",
      popoverForeground: "222 47% 11%",
      primary: "217 91% 50%",
      primaryForeground: "210 40% 98%",
      secondary: "210 20% 96%",
      secondaryForeground: "222 47% 11%",
      muted: "210 20% 96%",
      mutedForeground: "215 16% 47%",
      accent: "210 20% 96%",
      accentForeground: "222 47% 11%",
      destructive: "0 84% 60%",
      destructiveForeground: "210 40% 98%",
      warning: "45 93% 47%",
      warningForeground: "26 83% 14%",
      success: "142 76% 36%",
      successForeground: "355 100% 97%",
      border: "220 13% 91%",
      input: "220 13% 91%",
      ring: "217 91% 50%",
    },
    dark: {
      background: "224 71% 4%",
      foreground: "213 31% 91%",
      card: "224 71% 4%",
      cardForeground: "213 31% 91%",
      popover: "224 71% 4%",
      popoverForeground: "213 31% 91%",
      primary: "210 100% 52%",
      primaryForeground: "222 47% 11%",
      secondary: "223 47% 14%",
      secondaryForeground: "213 31% 91%",
      muted: "223 47% 14%",
      mutedForeground: "215 16% 65%",
      accent: "223 47% 14%",
      accentForeground: "213 31% 91%",
      destructive: "0 63% 45%",
      destructiveForeground: "210 40% 98%",
      warning: "45 93% 47%",
      warningForeground: "26 83% 14%",
      success: "142 70% 45%",
      successForeground: "144 61% 20%",
      border: "222 47% 18%",
      input: "222 47% 18%",
      ring: "212 100% 48%",
    }
  },
  spacing: {
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
  },
  borderRadius: {
    none: "0",
    sm: "0.125rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
  },
  typography: {
    fontFamily: {
      sans: "Inter, system-ui, sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
    }
  },
  shadows: {
    note: "Ultraminimalistisches Design verwendet keine Schatten. Nutze border-border stattdessen."
  }
};

// Export functions
const exportAsJSON = () => {
  const dataStr = JSON.stringify(designTokens, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design-tokens.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('Design-Tokens als JSON exportiert');
};

const exportAsCSS = () => {
  const generateCSSVariables = (colors: Record<string, string>, prefix: string = '') => {
    return Object.entries(colors)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `  --${cssKey}: ${value};`;
      })
      .join('\n');
  };

  const css = `/* Bestellung.pro Design Tokens */
/* Generated: ${new Date().toISOString()} */

:root {
  /* Light Theme Colors */
${generateCSSVariables(designTokens.colors.light)}

  /* Border Radius */
  --radius: 0.375rem;

  /* Spacing Scale */
${Object.entries(designTokens.spacing).map(([key, value]) => `  --spacing-${key}: ${value};`).join('\n')}
}

.dark {
  /* Dark Theme Colors */
${generateCSSVariables(designTokens.colors.dark)}
}

/* Typography */
body {
  font-family: ${designTokens.typography.fontFamily.sans};
}

/* Design Principles */
/*
 * 1. Keine Schatten - nutze border-border für Tiefe
 * 2. Konsistente Radii - nur rounded-md (6px)
 * 3. 1 Primary Button pro Screen
 * 4. Dezente Backgrounds - bg-muted/30
 * 5. Touch-optimiert - min h-11 für Mobile-Buttons
 */
`;

  const blob = new Blob([css], { type: 'text/css' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'design-tokens.css';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success('Design-Tokens als CSS exportiert');
};

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
                <DropdownMenuLabel>Design-Tokens exportieren</DropdownMenuLabel>
                <DropdownMenuSeparator />
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

        {/* Design Tokens Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Design Tokens</CardTitle>
            <CardDescription>Grundlegende CSS-Variablen des ultraminimalistischen B2B SaaS Design-Systems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CSS Variables Table */}
            <div>
              <h4 className="text-sm font-medium mb-3">Core CSS Variables</h4>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[180px]">Variable</TableHead>
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

            <Separator />

            {/* Shadows */}
            <div>
              <h4 className="text-sm font-medium mb-3">Shadows</h4>
              <p className="text-xs text-muted-foreground mb-4">Ultraminimalistisches Design: Keine Schatten, nur Borders</p>
              <div className="flex flex-wrap gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-card border border-border rounded-md flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">border</span>
                  </div>
                  <span className="text-xs font-mono text-primary">Empfohlen ✓</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-card shadow-sm rounded-md flex items-center justify-center opacity-50">
                    <span className="text-xs text-muted-foreground">shadow-sm</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Vermeiden</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-card shadow-md rounded-md flex items-center justify-center opacity-50">
                    <span className="text-xs text-muted-foreground">shadow-md</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">Vermeiden</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 bg-card shadow-lg rounded-md flex items-center justify-center opacity-50">
                    <span className="text-xs text-muted-foreground">shadow-lg</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground line-through">Nicht verwenden</span>
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
                  <ColorSwatch name="Success" cssVar="--success" className="bg-success" />
                  <ColorSwatch name="Warning" cssVar="--warning" className="bg-warning" />
                  <ColorSwatch name="Info" cssVar="--info" className="bg-info" />
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
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="info">Info</Button>
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

        {/* Typography */}
        <Card>
          <CardHeader>
            <CardTitle>Typografie</CardTitle>
            <CardDescription>Schriftgrößen und Heading-Hierarchie</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Headings */}
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

            {/* Body Text */}
            <div>
              <h4 className="text-sm font-medium mb-4">Body Text</h4>
              <div className="space-y-3">
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-base</span>
                  <p className="text-base">Standard body text (16px)</p>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-sm</span>
                  <p className="text-sm">Small text für Labels und Beschreibungen (14px)</p>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-xs text-muted-foreground w-20">text-xs</span>
                  <p className="text-xs">Extra small für Hinweise und Meta-Info (12px)</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Font Weights */}
            <div>
              <h4 className="text-sm font-medium mb-4">Schriftgewichte</h4>
              <div className="space-y-2">
                <p className="font-normal">font-normal (400) - Normaler Text</p>
                <p className="font-medium">font-medium (500) - Labels und betonte Texte</p>
                <p className="font-semibold">font-semibold (600) - Subheadings</p>
                <p className="font-bold">font-bold (700) - Headings und wichtige Elemente</p>
              </div>
            </div>

            <Separator />

            {/* Text Colors */}
            <div>
              <h4 className="text-sm font-medium mb-4">Textfarben</h4>
              <div className="space-y-2">
                <p className="text-foreground">text-foreground - Primärer Text</p>
                <p className="text-muted-foreground">text-muted-foreground - Sekundärer Text</p>
                <p className="text-primary">text-primary - Akzent/Link-Farbe</p>
                <p className="text-destructive">text-destructive - Fehler/Warnung</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables & Lists */}
        <Card>
          <CardHeader>
            <CardTitle>Tabellen & Listen</CardTitle>
            <CardDescription>Daten-Darstellung in tabellarischer Form und Listen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Table */}
            <div>
              <h4 className="text-sm font-medium mb-3">Tabelle</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">INV001</TableCell>
                      <TableCell>Max Mustermann</TableCell>
                      <TableCell><Badge variant="default">Aktiv</Badge></TableCell>
                      <TableCell className="text-right">€250.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">INV002</TableCell>
                      <TableCell>Anna Schmidt</TableCell>
                      <TableCell><Badge variant="secondary">Ausstehend</Badge></TableCell>
                      <TableCell className="text-right">€150.00</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">INV003</TableCell>
                      <TableCell>Peter Müller</TableCell>
                      <TableCell><Badge variant="destructive">Storniert</Badge></TableCell>
                      <TableCell className="text-right">€350.00</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Lists */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-3">Ungeordnete Liste</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Erstes Listenelement</li>
                  <li>Zweites Listenelement</li>
                  <li>Drittes Listenelement mit längerem Text der umbricht</li>
                  <li>Viertes Listenelement</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3">Geordnete Liste</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Schritt eins</li>
                  <li>Schritt zwei</li>
                  <li>Schritt drei</li>
                  <li>Schritt vier</li>
                </ol>
              </div>
            </div>

            <Separator />

            {/* Scroll Area with List */}
            <div>
              <h4 className="text-sm font-medium mb-3">Scrollbare Liste (max. 200px)</h4>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">Listeneintrag {i + 1}</span>
                      <Badge variant="outline">{i + 1}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator />

            {/* Description List */}
            <div>
              <h4 className="text-sm font-medium mb-3">Beschreibungsliste</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <dt className="font-medium w-24 shrink-0">Produkt:</dt>
                  <dd className="text-muted-foreground">Premium Paket</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-24 shrink-0">Preis:</dt>
                  <dd className="text-muted-foreground">€99.00 / Monat</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-medium w-24 shrink-0">Status:</dt>
                  <dd className="text-muted-foreground">Aktiv seit 01.01.2024</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        {/* Selects, Radios, Dropdowns & Popovers */}
        <Card>
          <CardHeader>
            <CardTitle>Selects, Radios, Dropdowns & Popovers</CardTitle>
            <CardDescription>Auswahl-Komponenten und Overlay-Elemente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Select */}
            <div>
              <h4 className="text-sm font-medium mb-3">Select</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Standard Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Option wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                      <SelectItem value="option2">Option 2</SelectItem>
                      <SelectItem value="option3">Option 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Disabled Select</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Deaktiviert..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Option 1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Radio Group */}
            <div>
              <h4 className="text-sm font-medium mb-3">Radio Group</h4>
              <RadioGroup defaultValue="option1" className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option1" id="radio-option1" />
                  <Label htmlFor="radio-option1">Option 1</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option2" id="radio-option2" />
                  <Label htmlFor="radio-option2">Option 2</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="option3" id="radio-option3" />
                  <Label htmlFor="radio-option3">Option 3 (mit längerem Text)</Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Dropdown Menu */}
            <div>
              <h4 className="text-sm font-medium mb-3">Dropdown Menu</h4>
              <div className="flex flex-wrap gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Dropdown öffnen
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Mein Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="h-4 w-4 mr-2" />
                      Profil
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Einstellungen
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Abmelden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Bearbeiten</DropdownMenuItem>
                    <DropdownMenuItem>Duplizieren</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Löschen</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Separator />

            {/* Popover */}
            <div>
              <h4 className="text-sm font-medium mb-3">Popover</h4>
              <div className="flex flex-wrap gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Info Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium">Popover Titel</h4>
                      <p className="text-sm text-muted-foreground">
                        Ein Popover kann beliebige Inhalte enthalten und wird bei Klick angezeigt.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">Formular Popover</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Schnelleinstellung</h4>
                      <div className="space-y-2">
                        <Label htmlFor="popover-input">Name</Label>
                        <Input id="popover-input" placeholder="Name eingeben..." />
                      </div>
                      <Button size="sm" className="w-full">Speichern</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tooltips & Hover-Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltips & Hover-Cards</CardTitle>
            <CardDescription>Kontextuelle Hinweise bei Hover und Fokus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tooltips */}
            <div>
              <h4 className="text-sm font-medium mb-3">Tooltips</h4>
              <div className="flex flex-wrap gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Hilfe-Tooltip</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary">Hover für Info</Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Tooltip unten positioniert</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost">Mit Beschreibung</Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p>Längerer Tooltip-Text mit mehr Details zur Funktion</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            <Separator />

            {/* Hover Cards */}
            <div>
              <h4 className="text-sm font-medium mb-3">Hover-Cards</h4>
              <div className="flex flex-wrap gap-4">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Button variant="link" className="p-0 h-auto">@benutzer</Button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="flex justify-between space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm font-semibold">@benutzer</h4>
                        <p className="text-sm text-muted-foreground">
                          Ein Beispielbenutzer für die Demo.
                        </p>
                        <div className="flex items-center pt-2">
                          <CalendarDays className="mr-2 h-4 w-4 opacity-70" />
                          <span className="text-xs text-muted-foreground">
                            Beigetreten am 01.01.2024
                          </span>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>

                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Badge variant="outline" className="cursor-pointer">Info Badge</Badge>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Zusätzliche Details</h4>
                      <p className="text-sm text-muted-foreground">
                        Hover-Cards eignen sich für reichhaltigere Inhalte als Tooltips.
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Accordion & Collapsible */}
        <Card>
          <CardHeader>
            <CardTitle>Accordion & Collapsible</CardTitle>
            <CardDescription>Auf- und zuklappbare Inhalte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Accordion */}
            <div>
              <h4 className="text-sm font-medium mb-3">Accordion</h4>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Was ist ein Accordion?</AccordionTrigger>
                  <AccordionContent>
                    Ein Accordion ist eine vertikale Liste von Elementen, die einzeln aufgeklappt werden können.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Wann verwendet man Accordions?</AccordionTrigger>
                  <AccordionContent>
                    Accordions eignen sich besonders für FAQs, Einstellungsbereiche oder wenn viele Informationen platzsparend dargestellt werden sollen.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Können mehrere Einträge offen sein?</AccordionTrigger>
                  <AccordionContent>
                    Mit <code className="bg-muted px-1 rounded">type="multiple"</code> können mehrere Einträge gleichzeitig geöffnet sein.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <Separator />

            {/* Collapsible */}
            <div>
              <h4 className="text-sm font-medium mb-3">Collapsible</h4>
              <Collapsible className="w-full space-y-2">
                <div className="flex items-center justify-between space-x-4 px-4 py-2 border rounded-lg">
                  <h4 className="text-sm font-semibold">Erweiterte Optionen</h4>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronsUpDown className="h-4 w-4" />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="space-y-2">
                  <div className="rounded-md border px-4 py-2 text-sm">
                    Option A: Erste erweiterte Einstellung
                  </div>
                  <div className="rounded-md border px-4 py-2 text-sm">
                    Option B: Zweite erweiterte Einstellung
                  </div>
                  <div className="rounded-md border px-4 py-2 text-sm">
                    Option C: Dritte erweiterte Einstellung
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>

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
