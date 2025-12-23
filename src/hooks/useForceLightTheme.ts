import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

/**
 * Hook to force light theme on mount and restore previous theme on unmount.
 * Useful for pages that should always appear in light mode (e.g., Supplier Portal).
 */
export const useForceLightTheme = () => {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const previousTheme = useRef<string | undefined>(undefined);
  const hasSetTheme = useRef(false);

  useEffect(() => {
    // Store the current theme before changing it
    if (!hasSetTheme.current) {
      previousTheme.current = theme || resolvedTheme;
      hasSetTheme.current = true;
    }

    // Force light theme
    setTheme('light');
    
    // Also set color-scheme for proper form controls and scrollbars
    document.documentElement.style.colorScheme = 'light';

    return () => {
      // Restore previous theme on unmount
      if (previousTheme.current && previousTheme.current !== 'light') {
        setTheme(previousTheme.current);
      }
      // Reset color-scheme
      document.documentElement.style.colorScheme = '';
    };
  }, [setTheme, theme, resolvedTheme]);
};
