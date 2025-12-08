import { useState, useEffect } from 'react';

export type ColorScheme = 'default' | 'orange' | 'blue' | 'green';

const COLOR_SCHEME_KEY = 'color-scheme';

export function useColorScheme() {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(COLOR_SCHEME_KEY) as ColorScheme) || 'default';
    }
    return 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all color scheme classes
    root.classList.remove('theme-default', 'theme-orange', 'theme-blue', 'theme-green');
    
    // Add the current color scheme class
    root.classList.add(`theme-${colorScheme}`);
    
    // Save to localStorage
    localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
  }, [colorScheme]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COLOR_SCHEME_KEY && e.newValue) {
        setColorSchemeState(e.newValue as ColorScheme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  return { colorScheme, setColorScheme };
}

export const colorSchemes: { id: ColorScheme; label: string; color: string }[] = [
  { id: 'default', label: 'Standard', color: 'hsl(222.2, 47.4%, 11.2%)' },
  { id: 'orange', label: 'Orange', color: 'hsl(24, 95%, 53%)' },
  { id: 'blue', label: 'Blau', color: 'hsl(217, 91%, 60%)' },
  { id: 'green', label: 'Grün', color: 'hsl(142, 71%, 45%)' },
];
