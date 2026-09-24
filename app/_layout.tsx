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
import { colors } from '@/theme';

export default function RootLayout() {
  const [sansLoaded] = useSansFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!sansLoaded) return <View style={{ backgroundColor: colors.canvas, flex: 1 }} />;

  return (
    <WalletProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.canvas }, headerShown: false }} />
    </WalletProvider>
  );
}
