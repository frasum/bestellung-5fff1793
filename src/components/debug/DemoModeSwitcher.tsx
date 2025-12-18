import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, X, Minimize2, Maximize2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DemoAuth {
  email: string;
  password: string;
}

interface Portal {
  name: string;
  path: string;
  color: string;
  bgColor: string;
  description: string;
  demoAuth?: DemoAuth | null;
  demoToken?: string;
}

const DEMO_PASSWORD = 'Sunshine2025&L';

const PORTALS: Portal[] = [
  {
    name: 'Bestellung.pro',
    path: '/suppliers',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800/50',
    description: 'Hauptanwendung',
    demoAuth: {
      email: 'frank.schumann@me.com',
      password: DEMO_PASSWORD,
    },
  },
  {
    name: 'B2B Lieferant',
    path: '/b2b/dashboard',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50 hover:bg-orange-200 dark:hover:bg-orange-800/50',
    description: 'Lieferanten-Dashboard',
    demoAuth: {
      email: 'buchhaltung@yum-thai.de',
      password: DEMO_PASSWORD,
    },
  },
  {
    name: 'B2B Kunde',
    path: '/b2b/portal',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-800/50',
    description: 'Kunden-Portal',
    demoAuth: {
      email: 'frasum@gmail.com',
      password: DEMO_PASSWORD,
    },
  },
  {
    name: 'Lieferanten-Portal',
    path: '/supplier-portal',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50 hover:bg-purple-200 dark:hover:bg-purple-800/50',
    description: 'Portal für Lieferanten (KAO)',
    demoToken: 'DEMO_SUPPLIER_PORTAL_TOKEN_2025',
  },
  {
    name: 'Simple Order',
    path: '/simple-order/443c35802365a54743f5813f00d4098c',
    color: 'text-teal-700 dark:text-teal-300',
    bgColor: 'bg-teal-100 dark:bg-teal-900/50 hover:bg-teal-200 dark:hover:bg-teal-800/50',
    description: 'Mitarbeiter-Bestellung (Moo)',
    demoToken: '443c35802365a54743f5813f00d4098c',
  },
  {
    name: '🎯 Onboarding',
    path: '/onboarding/questions',
    color: 'text-amber-700 dark:text-amber-300',
    bgColor: 'bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800/50',
    description: 'Fragen-basiertes Onboarding für Neukunden',
    demoAuth: null, // Kein Login - reine Demo-Simulation
  },
];

export function DemoModeSwitcher() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const clickTimer = useRef<NodeJS.Timeout>();
  const lastDPress = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Secret 5x click activation
  const handleSecretClick = () => {
    setClickCount(prev => prev + 1);
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => setClickCount(0), 1000);
    
    if (clickCount >= 4) { // 5th click
      setIsVisible(true);
      sessionStorage.setItem('demo-mode', 'true');
      setClickCount(0);
    }
  };

  // Auto-login and navigate to portal
  const handleNavigate = async (portal: Portal) => {
    // Skip if already on this portal (check base path for token-based portals)
    const basePath = portal.path.split('/').slice(0, 3).join('/');
    if (location.pathname.startsWith(basePath)) return;

    // Token-based portals - navigate with correct token format
    if (portal.demoToken) {
      if (portal.path.includes('supplier-portal')) {
        navigate(`/supplier-portal?token=${portal.demoToken}`);
      } else {
        navigate(portal.path);
      }
      return;
    }

    // Auth-based portals - auto-login with demo credentials
    if (portal.demoAuth) {
      setIsLoggingIn(true);
      try {
        // Sign out first to ensure clean login
        await supabase.auth.signOut();
        
        const { error } = await supabase.auth.signInWithPassword({
          email: portal.demoAuth.email,
          password: portal.demoAuth.password,
        });

        if (error) {
          toast({
            title: 'Login fehlgeschlagen',
            description: error.message,
            variant: 'destructive',
          });
          setIsLoggingIn(false);
          return;
        }

        toast({
          title: `Eingeloggt als ${portal.demoAuth.email}`,
          description: portal.description,
        });

        // Small delay to ensure session is established
        setTimeout(() => {
          navigate(portal.path);
          setIsLoggingIn(false);
        }, 300);
      } catch (err) {
        console.error('Demo login error:', err);
        setIsLoggingIn(false);
      }
    } else {
      navigate(portal.path);
    }
  };

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

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Double-D shortcut
      if (e.key === 'd' || e.key === 'D') {
        const now = Date.now();
        if (now - lastDPress.current < 500) {
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
        lastDPress.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.removeItem('demo-mode');
  };

  const currentPortal = PORTALS.find(p => location.pathname.startsWith(p.path));

  // Always render the secret click area
  if (!isVisible) {
    return (
      <div 
        className="fixed bottom-2 right-2 w-12 h-12 cursor-default z-[9998]"
        onClick={handleSecretClick}
        aria-hidden="true"
      />
    );
  }

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
          {/* Left: Demo Label + Loading indicator */}
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground shrink-0">
            {isLoggingIn ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-primary" />
            )}
            <span>{isLoggingIn ? 'Anmelden...' : 'Demo'}</span>
          </div>

          {/* Center: Portal Chips */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {PORTALS.map((portal) => {
              const isActive = location.pathname.startsWith(portal.path);
              return (
                <button
                  key={portal.path}
                  onClick={() => handleNavigate(portal)}
                  disabled={isLoggingIn}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                    portal.bgColor,
                    portal.color,
                    isActive && 'ring-2 ring-offset-1 ring-primary shadow-md scale-105',
                    isLoggingIn && 'opacity-50 cursor-not-allowed'
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
