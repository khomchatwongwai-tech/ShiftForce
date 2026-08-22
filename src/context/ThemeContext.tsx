import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  highContrast: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'workqora_theme';
const HIGH_CONTRAST_STORAGE_KEY = 'workqora_high_contrast';

function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function detectInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {}
  return 'light';
}

export function detectInitialHighContrast(): boolean {
  try {
    const saved = localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
    if (saved !== null) {
      return saved === 'true';
    }
  } catch {}
  return true; // Default high-contrast dark for late-night shifts
}

export const ThemeProvider: React.FC<{ children: ReactNode; initialTheme?: ThemeMode }> = ({
  children,
  initialTheme,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme || detectInitialTheme());
  const [highContrast, setHighContrastState] = useState<boolean>(detectInitialHighContrast());
  const [systemDark, setSystemDark] = useState<boolean>(getSystemPrefersDark());

  // Listen to OS system color scheme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  // Apply classes to document element
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      if (highContrast) {
        root.classList.add('high-contrast-dark');
      } else {
        root.classList.remove('high-contrast-dark');
      }
    } else {
      root.classList.remove('dark');
      root.classList.remove('high-contrast-dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [isDark, highContrast]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const setHighContrast = (enabled: boolean) => {
    setHighContrastState(enabled);
    try {
      localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, String(enabled));
    } catch {}
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        highContrast,
        setTheme,
        toggleTheme,
        setHighContrast,
        toggleHighContrast,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
