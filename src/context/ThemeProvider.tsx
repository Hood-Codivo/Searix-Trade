import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors, type ColorScheme, type ThemeColors } from '@/theme';

const STORAGE_KEY = 'searix-color-scheme';

type ThemeContextValue = {
  scheme: ColorScheme;
  colors: ThemeColors;
  isDark: boolean;
  toggleScheme: () => void;
  setScheme: (scheme: ColorScheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Defaults to the device's own scheme until the user picks one explicitly, then remembers that
// choice (same SecureStore pattern as the app-lock preference in src/services/appLock.ts).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [scheme, setSchemeState] = useState<ColorScheme>(systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    // SecureStore isn't backed by a native keychain on web -- same fallback-to-null pattern as
    // getAppLockPreference() in src/services/appLock.ts, so a missing/unsupported store just means
    // "no saved preference yet" instead of crashing the provider.
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setSchemeState(stored);
    }).catch(() => {});
  }, []);

  const setScheme = (next: ColorScheme) => {
    setSchemeState(next);
    void SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo<ThemeContextValue>(() => ({
    scheme,
    colors: scheme === 'dark' ? darkColors : lightColors,
    isDark: scheme === 'dark',
    toggleScheme: () => setScheme(scheme === 'dark' ? 'light' : 'dark'),
    setScheme,
  }), [scheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
