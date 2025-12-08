import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ColorScheme = 'default' | 'orange' | 'blue' | 'green';

const COLOR_SCHEME_KEY = 'color-scheme';

export function useColorScheme() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Local state for immediate UI updates
  const [localScheme, setLocalScheme] = useState<ColorScheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(COLOR_SCHEME_KEY) as ColorScheme) || 'default';
    }
    return 'default';
  });

  // Fetch color scheme from database when logged in
  const { data: dbScheme } = useQuery({
    queryKey: ['color-scheme', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('color_scheme')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching color scheme:', error);
        return null;
      }
      
      return (data?.color_scheme as ColorScheme) || 'default';
    },
    enabled: !!user?.id,
  });

  // Mutation to save color scheme to database
  const updateColorScheme = useMutation({
    mutationFn: async (scheme: ColorScheme) => {
      if (!user?.id) {
        throw new Error('User not logged in');
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ color_scheme: scheme })
        .eq('id', user.id);
      
      if (error) throw error;
      return scheme;
    },
    onSuccess: (scheme) => {
      queryClient.setQueryData(['color-scheme', user?.id], scheme);
    },
  });

  // Determine the effective color scheme
  const colorScheme = user?.id && dbScheme ? dbScheme : localScheme;

  // Apply color scheme to DOM
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all color scheme classes
    root.classList.remove('theme-default', 'theme-orange', 'theme-blue', 'theme-green');
    
    // Add the current color scheme class
    root.classList.add(`theme-${colorScheme}`);
    
    // Save to localStorage as fallback
    localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
  }, [colorScheme]);

  // Sync database scheme to local state when loaded
  useEffect(() => {
    if (dbScheme) {
      setLocalScheme(dbScheme);
    }
  }, [dbScheme]);

  const setColorScheme = (scheme: ColorScheme) => {
    // Update local state immediately for responsive UI
    setLocalScheme(scheme);
    localStorage.setItem(COLOR_SCHEME_KEY, scheme);
    
    // Persist to database if logged in
    if (user?.id) {
      updateColorScheme.mutate(scheme);
    }
  };

  return { colorScheme, setColorScheme };
}

export const colorSchemes: { id: ColorScheme; label: string; color: string }[] = [
  { id: 'default', label: 'Standard', color: 'hsl(222.2, 47.4%, 11.2%)' },
  { id: 'orange', label: 'Orange', color: 'hsl(24, 95%, 53%)' },
  { id: 'blue', label: 'Blau', color: 'hsl(217, 91%, 60%)' },
  { id: 'green', label: 'Grün', color: 'hsl(142, 71%, 45%)' },
];
