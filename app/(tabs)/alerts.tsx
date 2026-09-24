import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, RefreshCw, TriangleAlert } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlerts } from '@/hooks/useMarkets';
import { colors, font, radius, spacing } from '@/theme';
import type { Alert, AlertSeverity } from '@/types/market';

const SEVERITY_COLOR: Record<AlertSeverity, string> = { watch: colors.amber, warning: colors.red };
const SEVERITY_LABEL: Record<AlertSeverity, string> = { watch: 'WATCH', warning: 'WARNING' };

export default function AlertsScreen() {
  const { data: alerts, loading, error, retry } = useAlerts();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.content}
        data={loading || error ? [] : alerts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>PEG MONITORING</Text>
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.copy}>Real premium deviations between a tokenized stock and its equity reference, computed from live prices — not a simulated feed.</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }: { item: Alert }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={[styles.iconWell, { backgroundColor: item.severity === 'warning' ? colors.redSoft : colors.amberSoft }]}>
                <TriangleAlert color={SEVERITY_COLOR[item.severity]} size={18} />
              </View>
              <View style={styles.identity}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
              <View style={[styles.severityPill, { backgroundColor: item.severity === 'warning' ? colors.redSoft : colors.amberSoft }]}>
                <Text style={[styles.severityText, { color: SEVERITY_COLOR[item.severity] }]}>{SEVERITY_LABEL[item.severity]}</Text>
              </View>
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push(`/market/${item.marketId}`)} style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View market</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.state}><ActivityIndicator color={colors.amber} /><Text style={styles.stateTitle}>Checking for alerts</Text></View>
          ) : error ? (
            <View style={styles.state}><RefreshCw color={colors.red} size={24} /><Text style={styles.stateTitle}>Couldn’t load alerts</Text><Text style={styles.stateCopy}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void retry()} style={styles.action}><Text style={styles.actionText}>Try again</Text></Pressable></View>
          ) : (
            <View style={styles.state}><Bell color={colors.amber} size={28} /><Text style={styles.stateTitle}>No alerts right now</Text><Text style={styles.stateCopy}>You’ll see one here if a tokenized stock’s price drifts significantly from its real equity reference.</Text></View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { paddingBottom: spacing.xl },
  eyebrow: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1.1 },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 30, letterSpacing: -0.8, marginTop: spacing.sm },
  copy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, maxWidth: 360 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  cardTop: { alignItems: 'center', flexDirection: 'row' },
  iconWell: { alignItems: 'center', borderRadius: radius.md, height: 38, justifyContent: 'center', width: 38 },
  identity: { flex: 1, marginLeft: spacing.md },
  symbol: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14 },
  date: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 9, marginTop: 3 },
  severityPill: { borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 5 },
  severityText: { fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.5 },
  message: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, lineHeight: 19, marginTop: spacing.md },
  viewButton: { alignSelf: 'flex-start', marginTop: spacing.md },
  viewButtonText: { color: colors.blue, fontFamily: font.sansSemiBold, fontSize: 12 },
  state: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.xxl },
  stateTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 15 },
  stateCopy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12, lineHeight: 18, maxWidth: 280, textAlign: 'center' },
  action: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.sm, minHeight: 44, paddingHorizontal: spacing.lg },
  actionText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 12 },
});
