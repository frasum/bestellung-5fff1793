import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bug, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Building2,
  Truck,
  Users,
  Package
} from 'lucide-react';

interface PortalInfo {
  name: string;
  path: string;
  color: string;
  bgColor: string;
  icon: typeof Building2;
  credentials?: string;
}

const PORTALS: PortalInfo[] = [
  {
    name: 'Bestellung.pro',
    path: '/suppliers',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Building2,
    credentials: 'Dein Admin-Account',
  },
  {
    name: 'B2B Supplier',
    path: '/b2b/dashboard',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    icon: Truck,
    credentials: 'luigi@bestellung.pro',
  },
  {
    name: 'B2B Customer',
    path: '/b2b/portal',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: Users,
    credentials: 'frasum@test.de',
  },
  {
    name: 'Supplier Portal',
    path: '/supplier-portal',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: Package,
    credentials: 'Magic Link via Suppliers',
  },
];

export function DevNavigationPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const location = useLocation();

  // Check dev-mode from localStorage
  useEffect(() => {
    const checkDevMode = () => {
      setIsVisible(localStorage.getItem('dev-mode') === 'true');
    };
    
    checkDevMode();
    window.addEventListener('storage', checkDevMode);
    
    // Keyboard shortcut: Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        const newValue = localStorage.getItem('dev-mode') !== 'true';
        localStorage.setItem('dev-mode', String(newValue));
        setIsVisible(newValue);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('storage', checkDevMode);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isVisible) return null;

  // Detect current portal
  const currentPortal = PORTALS.find(p => location.pathname.startsWith(p.path.split('?')[0])) || PORTALS[0];
  const CurrentIcon = currentPortal.icon;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 p-3 rounded-full bg-card border-2 border-primary shadow-lg hover:scale-105 transition-transform"
        title="Dev Navigation öffnen"
      >
        <Bug className="h-5 w-5 text-primary" />
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-72 shadow-xl border-2 border-primary/20">
      <CardHeader className="py-2 px-3 flex flex-row items-center justify-between bg-muted/50">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bug className="h-4 w-4 text-primary" />
          Dev Navigation
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 space-y-3">
        {/* Current Context */}
        <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
          <span className="text-xs text-muted-foreground">Aktuell:</span>
          <Badge variant="outline" className={`${currentPortal.color} ${currentPortal.bgColor} border-0`}>
            <CurrentIcon className="h-3 w-3 mr-1" />
            {currentPortal.name}
          </Badge>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-2">
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = location.pathname.startsWith(portal.path.split('?')[0]);
            return (
              <Button
                key={portal.path}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`h-auto py-2 px-2 flex flex-col items-center gap-1 text-xs ${
                  isActive ? '' : portal.color
                }`}
                onClick={() => window.open(portal.path, '_blank')}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate w-full text-center">{portal.name}</span>
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Button>
            );
          })}
        </div>

        {/* Credentials Reference */}
        <div className="space-y-1 pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground">Test-Accounts:</p>
          {PORTALS.filter(p => p.credentials).map((portal) => (
            <div key={portal.path} className="text-xs flex items-center gap-1">
              <span className={`font-medium ${portal.color}`}>•</span>
              <span className="text-muted-foreground">{portal.name}:</span>
              <code className="text-foreground bg-muted px-1 rounded text-[10px]">
                {portal.credentials}
              </code>
            </div>
          ))}
        </div>

        {/* Shortcut hint */}
        <p className="text-[10px] text-muted-foreground text-center pt-1 border-t">
          Ctrl+Shift+D zum Ausblenden
        </p>
      </CardContent>
    </Card>
  );
}
