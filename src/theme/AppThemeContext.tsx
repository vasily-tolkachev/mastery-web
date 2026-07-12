import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { CssBaseline, ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material';
import type { PaletteMode } from '@mui/material';

export type ThemeModeSetting = 'system' | 'light' | 'dark';
export type ThemeAccent = 'cyan' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';

interface AppThemeContextValue {
  modeSetting: ThemeModeSetting;
  accent: ThemeAccent;
  setModeSetting: (value: ThemeModeSetting) => void;
  setAccent: (value: ThemeAccent) => void;
}

const MODE_KEY = 'mastery.theme.mode';
const ACCENT_KEY = 'mastery.theme.accent';

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

const accents: Record<ThemeAccent, { light: string; dark: string }> = {
  cyan: { light: '#0284c7', dark: '#4fc3f7' },
  indigo: { light: '#4f46e5', dark: '#9fa8da' },
  emerald: { light: '#059669', dark: '#34d399' },
  amber: { light: '#d97706', dark: '#f59e0b' },
  rose: { light: '#e11d48', dark: '#fb7185' },
  slate: { light: '#334155', dark: '#94a3b8' },
};

function getSystemMode(): PaletteMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [modeSetting, setModeSetting] = useState<ThemeModeSetting>(() => {
    const raw = localStorage.getItem(MODE_KEY);
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system';
  });
  const [accent, setAccent] = useState<ThemeAccent>(() => {
    const raw = localStorage.getItem(ACCENT_KEY);
    return raw && raw in accents ? (raw as ThemeAccent) : 'cyan';
  });
  const [systemMode, setSystemMode] = useState<PaletteMode>(() => getSystemMode());

  useEffect(() => {
    localStorage.setItem(MODE_KEY, modeSetting);
  }, [modeSetting]);

  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accent);
  }, [accent]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemMode(media.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedMode: PaletteMode = modeSetting === 'system' ? systemMode : modeSetting;
  const primary = accents[accent][resolvedMode];

  const theme = useMemo(() => {
    const base = createTheme({
        palette: {
          mode: resolvedMode,
          primary: { main: primary },
          secondary: { main: resolvedMode === 'dark' ? '#94a3b8' : '#64748b' },
          background:
            resolvedMode === 'dark'
              ? { default: '#0b1020', paper: '#111831' }
              : { default: '#f8fafc', paper: '#ffffff' },
        },
        shape: { borderRadius: 8 },
        typography: {
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          fontSize: 16,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                minHeight: 44,
                textTransform: 'none',
              },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: {
                minWidth: 44,
                minHeight: 44,
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: {
                minHeight: 44,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                borderColor: resolvedMode === 'dark' ? 'rgba(117, 137, 170, 0.24)' : 'rgba(15, 23, 42, 0.12)',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: resolvedMode === 'dark' ? '#111831' : '#ffffff',
                borderBottom:
                  resolvedMode === 'dark' ? '1px solid rgba(117, 137, 170, 0.24)' : '1px solid rgba(15, 23, 42, 0.12)',
              },
            },
          },
        },
      });
    return responsiveFontSizes(base, { factor: 2.1 });
  }, [resolvedMode, primary]);

  const value = useMemo(
    () => ({ modeSetting, accent, setModeSetting, setAccent }),
    [modeSetting, accent],
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
