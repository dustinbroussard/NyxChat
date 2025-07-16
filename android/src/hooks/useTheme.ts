
import { useState, useEffect } from 'react';

type Theme = 'amoled-dark' | 'default-light' | 'blue-dark' | 'blue-light' | 'red-dark' | 'red-light';

const STORAGE_KEY = 'nyx-theme';

export const useTheme = () => {
  const [theme, setThemeState] = useState<Theme>('amoled-dark');

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme;
    if (saved && ['amoled-dark', 'default-light', 'blue-dark', 'blue-light', 'red-dark', 'red-light'].includes(saved)) {
      setThemeState(saved);
    }
  }, []);

  // Save theme to localStorage and apply to document
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    
    // Update document attribute
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Apply theme on mount and changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Get theme-specific colors for voice mode
  const getVoiceColors = () => {
    const colors = {
      'amoled-dark': {
        inactive: '#1a1a1a',
        listening: '#10b981',
        processing: '#8b5cf6',
        speaking: '#f59e0b'
      },
      'default-light': {
        inactive: '#374151',
        listening: '#10b981',
        processing: '#8b5cf6',
        speaking: '#f59e0b'
      },
      'blue-dark': {
        inactive: '#1e3a8a',
        listening: '#06b6d4',
        processing: '#3b82f6',
        speaking: '#0ea5e9'
      },
      'blue-light': {
        inactive: '#1e40af',
        listening: '#0891b2',
        processing: '#2563eb',
        speaking: '#0284c7'
      },
      'red-dark': {
        inactive: '#7f1d1d',
        listening: '#f97316',
        processing: '#dc2626',
        speaking: '#ea580c'
      },
      'red-light': {
        inactive: '#991b1b',
        listening: '#ea580c',
        processing: '#dc2626',
        speaking: '#f97316'
      }
    };
    
    return colors[theme] || colors['amoled-dark'];
  };

  return {
    theme,
    setTheme,
    getVoiceColors,
  };
};
