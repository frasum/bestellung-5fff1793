import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Portal {
  name: string;
  path: string;
  color: string;
  bgColor: string;
  description: string;
}

const PORTALS: Portal[] = [
  {
    name: 'Bestellung.pro',
    path: '/suppliers',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/50',
    description: 'Hauptanwendung',
  },
  {
    name: 'B2B Lieferant',
    path: '/b2b/dashboard',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-800/50',
    description: 'Lieferanten-Dashboard',
  },
  {
    name: 'B2B Kunde',
    path: '/b2b/portal',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50',
    description: 'Kunden-Portal',
  },
  {
    name: 'Lieferanten-Portal',
    path: '/supplier-portal',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800/50',
    description: 'Portal für Lieferanten',
  },
  {
    name: 'Simple Order',
    path: '/simple-order',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100 dark:bg-teal-900/50 hover:bg-teal-200 dark:hover:bg-teal-800/50',
    description: 'Mitarbeiter-Bestellung',
  },
];

export function DemoModeSwitcher() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check URL parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'true') {
      setIsVisible(true);
      sessionStorage.setItem('demo-mode', 'true');
    }

    // Check session storage
    if (sessionStorage.getItem('demo-mode') === 'true') {
      setIsVisible(true);
    }

    // Keyboard shortcut: Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => {
          const newValue = !prev;
          if (newValue) {
            sessionStorage.setItem('demo-mode', 'true');
          } else {
            sessionStorage.removeItem('demo-mode');
          }
          return newValue;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.removeItem('demo-mode');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const currentPortal = PORTALS.find(p => location.pathname.startsWith(p.path));

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9999]">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="gap-2 bg-background/95 backdrop-blur-sm shadow-lg border-primary/30"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium">Demo</span>
          <Maximize2 className="h-3 w-3 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-background/95 backdrop-blur-sm border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Demo Label */}
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Demo</span>
          </div>

          {/* Center: Portal Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {PORTALS.map((portal) => {
              const isActive = location.pathname.startsWith(portal.path);
              return (
                <button
                  key={portal.path}
                  onClick={() => handleNavigate(portal.path)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                    portal.bgColor,
                    portal.color,
                    isActive && 'ring-2 ring-offset-1 ring-primary shadow-md scale-105'
                  )}
                  title={portal.description}
                >
                  {portal.name}
                </button>
              );
            })}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
              title="Minimieren"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleClose}
              title="Demo-Modus beenden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Current portal indicator */}
        {currentPortal && (
          <div className="text-xs text-muted-foreground text-center mt-1">
            {currentPortal.description}
          </div>
        )}
      </div>
    </div>
  );
}
