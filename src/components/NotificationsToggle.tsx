import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { BellRing } from 'lucide-react-native';
import { marketApi } from '@/services/api';
import { enablePushAlerts, disablePushAlerts, PushUnavailableError } from '@/services/push';
import { colors, font, radius, spacing } from '@/theme';

// On/off for alert push notifications (banner + sound) on this wallet. Reflects whatever the backend
// actually has registered, not just a local guess, so it stays correct after a reinstall or a second device.
export function NotificationsToggle({ address }: { address: string }) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    marketApi.pushTokenStatus(address, controller.signal)
      .then((status) => setEnabled(status.registered))
      .catch(() => undefined)
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [address]);

  const toggle = async (next: boolean) => {
    setBusy(true);
    setError(null);
    try {
      if (next) await enablePushAlerts(address);
      else await disablePushAlerts(address);
      setEnabled(next);
    } catch (err: unknown) {
      setEnabled(!next);
      setError(err instanceof PushUnavailableError ? err.message : err instanceof Error ? err.message : 'Could not change notification settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWell}><BellRing color={colors.amber} size={18} /></View>
        <View style={styles.flex}>
          <Text style={styles.title}>Push notifications</Text>
          <Text style={styles.copy}>Banner and sound when one of your alerts fires.</Text>
        </View>
        {loading || busy ? <ActivityIndicator color={colors.amber} /> : <Switch onValueChange={toggle} thumbColor={colors.surface} trackColor={{ false: colors.border, true: colors.amber }} value={enabled} />}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  error: { color: colors.red, fontFamily: font.sans, fontSize: 12, marginTop: spacing.sm },
});
