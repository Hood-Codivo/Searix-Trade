import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { getAppLockPreference, isAppLockAvailable, setAppLockPreference } from '@/services/appLock';
import { colors, font, radius, spacing } from '@/theme';

// On/off for the app-open biometric lock. Local-only: no wallet needed, nothing sent to the backend --
// this guards the phone screen, not your funds, so it doesn't belong to any one connected wallet.
export function AppLockToggle() {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([isAppLockAvailable(), getAppLockPreference()]).then(([canUse, pref]) => {
      setAvailable(canUse);
      setEnabled(canUse && pref);
    });
  }, []);

  const toggle = async (next: boolean) => {
    setBusy(true);
    await setAppLockPreference(next);
    setEnabled(next);
    setBusy(false);
  };

  if (available === null) return null;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWell}><Fingerprint color={colors.amber} size={18} /></View>
        <View style={styles.flex}>
          <Text style={styles.title}>App lock</Text>
          <Text style={styles.copy}>{available ? 'Require your fingerprint, face, or passcode to open the app.' : 'No fingerprint, face, or passcode set up on this device.'}</Text>
        </View>
        {available ? (
          busy ? <ActivityIndicator color={colors.amber} /> : <Switch onValueChange={toggle} thumbColor={colors.surface} trackColor={{ false: colors.border, true: colors.amber }} value={enabled} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  iconWell: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: radius.md, height: 40, justifyContent: 'center', width: 40 },
  flex: { flex: 1 },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14 },
  copy: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 12, marginTop: 2 },
});
