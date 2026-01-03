import React, {createContext, useContext, useMemo} from 'react';
import {useColorScheme} from 'react-native';

const palette = {
  midnight: '#070A12',
  midnight2: '#0B1020',
  surface: '#0D1120',
  surface2: '#121A2E',
  text: '#EAF0FF',
  white: '#FFFFFF',
  black: '#000000',
  cyan: '#35D0FF',
  violet: '#7C5CFF',
  mint: '#3BE7B0',
  red: '#FF4D6D',
  amber: '#FFB020',
};

const base = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 24,
    pill: 999,
  },
  typography: {
    title: {fontSize: 32, fontWeight: '700', letterSpacing: -0.6},
    h2: {fontSize: 22, fontWeight: '700', letterSpacing: -0.2},
    h3: {fontSize: 18, fontWeight: '700'},
    body: {fontSize: 16, fontWeight: '500'},
    sub: {fontSize: 14, fontWeight: '500'},
    caption: {fontSize: 12, fontWeight: '600', letterSpacing: 0.2},
  },
};

const dark = {
  isDark: true,
  ...base,
  colors: {
    bg: palette.midnight,
    surface: palette.surface,
    surface2: palette.surface2,
    border: 'rgba(255,255,255,0.10)',
    text: palette.text,
    textSecondary: 'rgba(234,240,255,0.72)',
    muted: 'rgba(234,240,255,0.50)',
    accent: palette.cyan,
    accent2: palette.violet,
    success: palette.mint,
    error: palette.red,
    warning: palette.amber,
    shadow: 'rgba(0,0,0,0.45)',
  },
};

const light = {
  isDark: false,
  ...base,
  colors: {
    bg: '#F6F7FB',
    surface: palette.white,
    surface2: '#EEF1FB',
    border: 'rgba(11,18,32,0.10)',
    text: '#0B1220',
    textSecondary: 'rgba(11,18,32,0.72)',
    muted: 'rgba(11,18,32,0.50)',
    accent: '#0EA5FF',
    accent2: '#6D5CFF',
    success: '#12C48B',
    error: '#E63A55',
    warning: '#B45309',
    shadow: 'rgba(11,18,32,0.14)',
  },
};

const ThemeContext = createContext(null);

export const ThemeProvider = ({children}) => {
  const scheme = useColorScheme();
  const theme = useMemo(() => (scheme === 'dark' ? dark : light), [scheme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
};
