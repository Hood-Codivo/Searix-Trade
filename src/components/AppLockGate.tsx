import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { authenticateToOpen, getAppLockPreference } from '@/services/appLock';
import { isWalletInteractionActive } from '@/services/walletInteraction';
import { colors, font, radius, spacing } from '@/theme';

// Gates the whole app behind one biometric/passcode check -- on cold launch, and again whenever the app
// returns from the background. Never involved in signing a trade; that stays entirely the wallet's own
// prompt, so an app-lock check never adds a delay in the middle of a live quote.
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState<boolean | null>(null); // null = still deciding whether a lock applies
  const appState = useRef(AppState.currentState);

  const challenge = useCallback(async () => {
    const enabled = await getAppLockPreference();
    if (!enabled) { setLocked(false); return; }
    setLocked(true);
    const ok = await authenticateToOpen();
    setLocked(!ok);
  }, []);

  useEffect(() => { void challenge(); }, [challenge]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      const wasBackground = appState.current.match(/inactive|background/);
      // Skip the re-lock when we ourselves sent the app to the background to talk to the wallet app --
      // otherwise every authorize/sign round-trip would re-trigger the biometric prompt mid-connect.
      if (wasBackground && next === 'active' && !isWalletInteractionActive()) void challenge();
      appState.current = next;
    });
    return () => subscription.remove();
  }, [challenge]);

  // `children` (the navigator, WalletProvider's session restore, everything) stays mounted the whole
  // time -- only an opaque overlay toggles on top. Unmounting the navigator here instead would tear it
  // down mid-flight whenever a wallet handoff re-triggers the lock, which is exactly what produced
  // "state update on a component that hasn't mounted yet": Expo Router resolves the launch deep link
  // asynchronously right after the navigator mounts, and that resolution was landing on a fiber that
  // had since been unmounted and not yet remounted.
  return (
    <View style={styles.root}>
      {children}
      {locked !== false ? (
        <View style={styles.overlay}>
          {locked === null ? null : (
            <>
              <Image source={require('../../assets/images/brand-mark.png')} style={styles.mark} resizeMode="contain" />
              <Text style={styles.title}>Searix Trade is locked</Text>
              <Text style={styles.copy}>Unlock with your fingerprint, face, or device passcode to continue.</Text>
              <Pressable accessibilityRole="button" onPress={() => void challenge()} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
                <ShieldCheck color={colors.canvas} size={18} />
                <Text style={styles.buttonText}>Unlock</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { alignItems: 'center', backgroundColor: '#15161F', bottom: 0, gap: spacing.md, justifyContent: 'center', left: 0, padding: spacing.xl, position: 'absolute', right: 0, top: 0 },
  mark: { height: 72, marginBottom: spacing.lg, width: 72 },
  title: { color: '#FFFFFF', fontFamily: font.sansSemiBold, fontSize: 22 },
  copy: { color: '#C6C4D9', fontFamily: font.sans, fontSize: 14, maxWidth: 280, textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: radius.md, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg, minHeight: 50, paddingHorizontal: spacing.xl },
  buttonText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 14 },
  pressed: { opacity: 0.85 },
});
