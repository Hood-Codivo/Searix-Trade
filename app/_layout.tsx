import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts as useSansFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { View } from 'react-native';
import { WalletProvider } from '@/context/WalletProvider';
import { ThemeProvider, useTheme } from '@/context/ThemeProvider';
import { AppLockGate } from '@/components/AppLockGate';
import { lightColors } from '@/theme';
// Side effect only: registers the foreground notification handler (banner + sound) before any screen mounts.
import '@/services/push';

function AppShell() {
  const { colors, isDark } = useTheme();
  return (
    <AppLockGate>
      <WalletProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ contentStyle: { backgroundColor: colors.canvas }, headerShown: false }} />
      </WalletProvider>
    </AppLockGate>
  );
}

export default function RootLayout() {
  const [sansLoaded] = useSansFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!sansLoaded) return <View style={{ backgroundColor: lightColors.canvas, flex: 1 }} />;

  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
