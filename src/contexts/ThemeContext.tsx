import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

type Theme = 'dark' | 'light';

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);

    // Capacitor status bar sync
    const applyStatusBarStyle = async () => {
      try {
        if (theme === 'light') {
          await StatusBar.setStyle({ style: Style.Dark }); // dark text for light theme
          await StatusBar.setBackgroundColor({ color: '#ffffff' });
        } else {
          await StatusBar.setStyle({ style: Style.Light }); // light text for dark theme
          await StatusBar.setBackgroundColor({ color: '#000000' });
        }
      } catch (err) {
        console.warn('StatusBar plugin error:', err);
      }
    };

    applyStatusBarStyle();
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

