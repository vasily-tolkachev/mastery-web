import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { CssBaseline, ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material';
import type { PaletteMode } from '@mui/material';

export type ThemeModeSetting = 'system' | 'light' | 'dark';
export type ThemeAccent =
  | 'cyan'
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'slate'
  | 'violet'
  | 'teal'
  | 'sky'
  | 'lime'
  | 'orange'
  | 'fuchsia'
  | 'red'
  | 'blue';

interface AppThemeContextValue {
  modeSetting: ThemeModeSetting;
  accent: ThemeAccent;
  darkTheme: DarkTheme;
  setModeSetting: (value: ThemeModeSetting) => void;
  setAccent: (value: ThemeAccent) => void;
  setDarkTheme: (value: DarkTheme) => void;
}

const MODE_KEY = 'mastery.theme.mode';
const ACCENT_KEY = 'mastery.theme.accent';
const DARK_THEME_KEY = 'mastery.theme.darkTheme';

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export type DarkTheme = 'midnight' | 'graphite' | 'ocean' | 'forest' | 'violet' | 'espresso';

const accents: Record<ThemeAccent, { light: string; dark: string }> = {
  cyan: { light: '#0284c7', dark: '#4fc3f7' },
  indigo: { light: '#4f46e5', dark: '#9fa8da' },
  emerald: { light: '#059669', dark: '#34d399' },
  amber: { light: '#d97706', dark: '#f59e0b' },
  rose: { light: '#e11d48', dark: '#fb7185' },
  slate: { light: '#334155', dark: '#94a3b8' },
  violet: { light: '#7c3aed', dark: '#a78bfa' },
  teal: { light: '#0f766e', dark: '#2dd4bf' },
  sky: { light: '#0369a1', dark: '#38bdf8' },
  lime: { light: '#65a30d', dark: '#a3e635' },
  orange: { light: '#ea580c', dark: '#fb923c' },
  fuchsia: { light: '#c026d3', dark: '#e879f9' },
  red: { light: '#dc2626', dark: '#f87171' },
  blue: { light: '#2563eb', dark: '#60a5fa' },
};

const darkThemes: Record<DarkTheme, { default: string; paper: string; border: string }> = {
  midnight: { default: '#0b1020', paper: '#111831', border: 'rgba(117, 137, 170, 0.24)' },
  graphite: { default: '#0f1115', paper: '#171a21', border: 'rgba(148, 163, 184, 0.25)' },
  ocean: { default: '#08141f', paper: '#0f2230', border: 'rgba(125, 211, 252, 0.22)' },
  forest: { default: '#0c1712', paper: '#13231b', border: 'rgba(110, 231, 183, 0.22)' },
  violet: { default: '#140f22', paper: '#1d1730', border: 'rgba(196, 181, 253, 0.24)' },
  espresso: { default: '#17110d', paper: '#231a15', border: 'rgba(251, 146, 60, 0.22)' },
};

function getSystemMode(): PaletteMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [modeSetting, setModeSetting] = useState<ThemeModeSetting>(() => {
    const raw = localStorage.getItem(MODE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'dark';
  });
  const [accent, setAccent] = useState<ThemeAccent>(() => {
    const raw = localStorage.getItem(ACCENT_KEY);
    return raw && raw in accents ? (raw as ThemeAccent) : 'violet';
  });
  const [darkTheme, setDarkTheme] = useState<DarkTheme>(() => {
    const raw = localStorage.getItem(DARK_THEME_KEY);
    return raw && raw in darkThemes ? (raw as DarkTheme) : 'graphite';
  });
  const [systemMode, setSystemMode] = useState<PaletteMode>(() => getSystemMode());

  useEffect(() => {
    localStorage.setItem(MODE_KEY, modeSetting);
  }, [modeSetting]);

  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);
  useEffect(() => {
    localStorage.setItem(DARK_THEME_KEY, darkTheme);
  }, [darkTheme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemMode(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedMode: PaletteMode = modeSetting === 'system' ? systemMode : modeSetting;
  const primary = accents[accent][resolvedMode];
  const darkPalette = darkThemes[darkTheme];

  const theme = useMemo(() => {
    const base = createTheme({
        palette: {
          mode: resolvedMode,
          primary: { main: primary },
          secondary: { main: resolvedMode === 'dark' ? '#94a3b8' : '#64748b' },
          background:
            resolvedMode === 'dark'
              ? { default: darkPalette.default, paper: darkPalette.paper }
              : { default: '#f8fafc', paper: '#ffffff' },
        },
        shape: { borderRadius: 8 },
        typography: {
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          fontSize: 16,
        },
        components: {
          MuiButtonBase: {
            defaultProps: {
              disableRipple: true,
            },
            styleOverrides: {
              root: {
                WebkitTapHighlightColor: 'transparent',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                minHeight: 56,
                textTransform: 'none',
                fontSize: '1rem',
                '&:active': {
                  transform: 'none',
                },
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                minWidth: 52,
                minHeight: 52,
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                minHeight: 56,
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                minHeight: 52,
                fontSize: '1rem',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderColor: resolvedMode === 'dark' ? darkPalette.border : 'rgba(15, 23, 42, 0.12)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: resolvedMode === 'dark' ? darkPalette.paper : '#ffffff',
                borderBottom:
                  resolvedMode === 'dark' ? `1px solid ${darkPalette.border}` : '1px solid rgba(15, 23, 42, 0.12)',
              },
            },
          },
        },
      });
    return responsiveFontSizes(base, { factor: 2.1 });
  }, [resolvedMode, primary, darkPalette]);

  const value = useMemo(
    () => ({ modeSetting, accent, darkTheme, setModeSetting, setAccent, setDarkTheme }),
    [modeSetting, accent, darkTheme],
  );

  return (
    <AppThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const context = useContext(AppThemeContext);
  if (!context) throw new Error('useAppTheme must be used within AppThemeProvider');
  return context;
}
