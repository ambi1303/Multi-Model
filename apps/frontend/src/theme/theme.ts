import { createTheme, ThemeOptions } from '@mui/material/styles';
import { lightPalette, darkPalette } from './palette';
import { typography } from './typography';
import { components } from './components';
import { spacing, breakpoints } from './spacing';

const baseTheme: ThemeOptions = {
  typography,
  components,
  spacing: 8,
  breakpoints: {
    values: breakpoints,
  },
  shape: {
    borderRadius: 8,
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: lightPalette,
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: darkPalette,
});

// Design tokens for custom components
export const designTokens = {
  spacing,
  breakpoints,
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  zIndex: {
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};