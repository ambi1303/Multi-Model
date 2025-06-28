import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '../theme/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Try to get theme from cookies first, fallback to localStorage for migration
    let savedTheme = null;
    
    try {
      const { EmotiAnalyzeCookies } = require('../utils/cookies');
      savedTheme = EmotiAnalyzeCookies.getPreferences().theme;
    } catch (error) {
      console.warn('Cookie manager not available, falling back to localStorage');
    }
    
    // Fallback to localStorage if no cookie theme found
    if (!savedTheme) {
      savedTheme = localStorage.getItem('theme-mode');
    }
    
    return (savedTheme as ThemeMode) || 'light';
  });

  useEffect(() => {
    // Save to both cookies and localStorage for migration compatibility
    try {
      const { EmotiAnalyzeCookies } = require('../utils/cookies');
      EmotiAnalyzeCookies.setPreferences({ theme: mode });
    } catch (error) {
      console.warn('Cookie manager not available during theme save');
    }
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const theme = mode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};