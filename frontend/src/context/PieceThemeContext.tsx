import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type PieceTheme = 'standard' | 'vedic';

interface PieceThemeContextType {
  pieceTheme: PieceTheme;
  setPieceTheme: (theme: PieceTheme) => void;
  togglePieceTheme: () => void;
}

const PieceThemeContext = createContext<PieceThemeContextType | null>(null);

const STORAGE_KEY = 'chaturanga_piece_theme';

export const PieceThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pieceTheme, setPieceThemeState] = useState<PieceTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'vedic' || saved === 'standard') {
        return saved;
      }
    } catch {
      // localStorage fallback
    }
    return 'standard';
  });

  const setPieceTheme = useCallback((theme: PieceTheme) => {
    setPieceThemeState(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // safe fallback
    }
  }, []);

  const togglePieceTheme = useCallback(() => {
    const nextTheme = pieceTheme === 'standard' ? 'vedic' : 'standard';
    setPieceTheme(nextTheme);
  }, [pieceTheme, setPieceTheme]);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'standard' || e.newValue === 'vedic')) {
        setPieceThemeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <PieceThemeContext.Provider value={{ pieceTheme, setPieceTheme, togglePieceTheme }}>
      {children}
    </PieceThemeContext.Provider>
  );
};

export function usePieceTheme(): PieceThemeContextType {
  const context = useContext(PieceThemeContext);
  if (!context) {
    // If used outside provider, gracefully fallback to standard
    return {
      pieceTheme: 'standard',
      setPieceTheme: () => {},
      togglePieceTheme: () => {},
    };
  }
  return context;
}
