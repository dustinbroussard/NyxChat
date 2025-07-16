import React, { createContext, useContext, useEffect, useState } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';

type ThemeMode = 'dark' | 'light';
type ThemeColor = 'default' | 'blue' | 'red' | 'green' | 'purple';

type ThemeContextType = {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  toggleThemeMode: () => void;
  setThemeColor: (color: ThemeColor) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('themeMode');
    return (stored as ThemeMode) || 'light';
  });

  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const stored = localStorage.getItem('themeColor');
    return (stored as ThemeColor) || 'default';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all theme classes first
    root.classList.remove('light', 'dark', 'blue-dark', 'blue-light', 'red-dark', 
                         'red-light', 'green-dark', 'green-light', 'purple-dark', 'purple-light');
    // Add the current theme class
    root.classList.add(`${themeColor}-${themeMode}`);
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('themeColor', themeColor);

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

  const toggleThemeMode = () => {
    setThemeMode(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      themeColor,
      toggleThemeMode,
      setThemeColor
    }}>
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

