import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type StyleMode = 'classic' | 'modern';

interface StyleContextType {
  styleMode: StyleMode;
  setStyleMode: (mode: StyleMode) => void;
  isModern: boolean;
}

const StyleContext = createContext<StyleContextType | undefined>(undefined);

const STORAGE_KEY = 'ui-style-mode';

export const StyleProvider = ({ children }: { children: ReactNode }) => {
  const [styleMode, setStyleModeState] = useState<StyleMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (stored as StyleMode) || 'classic';
    }
    return 'classic';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('style-classic', 'style-modern');
    
    // Add the current style class
    root.classList.add(`style-${styleMode}`);
    
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, styleMode);
  }, [styleMode]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setStyleModeState(e.newValue as StyleMode);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setStyleMode = (mode: StyleMode) => {
    setStyleModeState(mode);
  };

  return (
    <StyleContext.Provider value={{ 
      styleMode, 
      setStyleMode, 
      isModern: styleMode === 'modern' 
    }}>
      {children}
    </StyleContext.Provider>
  );
};

export const useStyleContext = () => {
  const context = useContext(StyleContext);
  if (context === undefined) {
    throw new Error('useStyleContext must be used within a StyleProvider');
  }
  return context;
};
