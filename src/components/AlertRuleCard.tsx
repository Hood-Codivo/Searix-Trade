import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BellPlus, X } from 'lucide-react-native';
import { useWallet } from '@/context/WalletProvider';
import { marketApi } from '@/services/api';
import { colors, font, radius, spacing } from '@/theme';
import type { AlertRule, Market } from '@/types/market';

// Set a price or premium threshold on this market. When it's crossed, an alert appears in the Alerts tab,
// and tapping it opens this market's analysis.
export function AlertRuleCard({ market }: { market: Market }) {
  const { account, status, connect } = useWallet();
  const address = status === 'connected' ? account?.address : undefined;
  const isStock = market.assetClass === 'tokenized-stock' && Boolean(market.reference?.isLive);
  const [kind, setKind] = useState<'price' | 'premium'>('price');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('');
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!address) { setRules([]); return; }
    const controller = new AbortController();
    marketApi.listAlertRules(address, controller.signal)
      .then((all) => setRules(all.filter((rule) => rule.marketId === market.id)))
      .catch(() => undefined);
    return () => controller.abort();
  }, [address, market.id]);

  const create = async () => {
    if (!address) return;
    const value = Number(threshold.replace(/,/g, ''));
    if (!Number.isFinite(value)) { setMessage('Enter a number for the threshold.'); return; }
    setSaving(true);
    setMessage(null);
    try {
      const rule = await marketApi.createAlertRule({ walletAddress: address, marketId: market.id, kind, direction, threshold: value });
      setRules((current) => [...current, rule]);
      setThreshold('');
      setMessage('Alert set. You\'ll see it in the Alerts tab when it triggers.');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Could not set the alert.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (rule: AlertRule) => {
    if (!address) return;
    await marketApi.deleteAlertRule(rule.id, address).catch(() => undefined);
    setRules((current) => current.filter((item) => item.id !== rule.id));
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}><BellPlus color={colors.amber} size={18} /><Text style={styles.title}>Alert me when</Text></View>
      {!address ? (
        <Pressable accessibilityRole="button" onPress={connect} style={styles.secondary}><Text style={styles.secondaryText}>Connect a wallet to set alerts</Text></Pressable>
      ) : (
        <>
          <View style={styles.toggleRow}>
            {(['price', ...(isStock ? ['premium'] : [])] as Array<'price' | 'premium'>).map((option) => (
              <Pressable key={option} accessibilityRole="button" onPress={() => setKind(option)} style={[styles.toggle, kind === option && styles.toggleOn]}>
                <Text style={[styles.toggleText, kind === option && styles.toggleTextOn]}>{option === 'price' ? 'Price' : 'Premium %'}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.toggleRow}>
            {(['above', 'below'] as const).map((option) => (
              <Pressable key={option} accessibilityRole="button" onPress={() => setDirection(option)} style={[styles.toggle, direction === option && styles.toggleOn]}>
                <Text style={[styles.toggleText, direction === option && styles.toggleTextOn]}>{option === 'above' ? 'Goes above' : 'Drops below'}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              accessibilityLabel="Alert threshold"
              keyboardType="decimal-pad"
              onChangeText={setThreshold}
              placeholder={kind === 'price' ? `e.g. ${market.price.toFixed(2)}` : 'e.g. 2'}
              placeholderTextColor={colors.textSubtle}
              style={styles.input}
              value={threshold}
            />
            <Pressable accessibilityRole="button" disabled={saving || !threshold} onPress={create} style={[styles.primary, (saving || !threshold) && styles.disabled]}>
              {saving ? <ActivityIndicator color={colors.canvas} /> : <Text style={styles.primaryText}>Set alert</Text>}
            </Pressable>
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {rules.map((rule) => (
            <View key={rule.id} style={styles.ruleRow}>
              <Text style={styles.ruleText}>{rule.kind === 'price' ? 'Price' : 'Premium'} {rule.direction === 'above' ? '≥' : '≤'} {rule.threshold}{rule.kind === 'premium' ? '%' : ''}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Remove alert" onPress={() => remove(rule)} hitSlop={8}><X color={colors.textSubtle} size={16} /></Pressable>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: 1, marginTop: spacing.xl, padding: spacing.lg },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 15 },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  toggle: { borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  toggleOn: { backgroundColor: colors.amberSoft, borderColor: colors.amber },
  toggleText: { color: colors.textMuted, fontFamily: font.sansMedium, fontSize: 12 },
  toggleTextOn: { color: colors.amber },
  inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  input: { backgroundColor: colors.canvas, borderRadius: radius.md, color: colors.text, flex: 1, fontFamily: font.monoMedium, fontSize: 14, minHeight: 44, paddingHorizontal: spacing.md },
  primary: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: radius.md, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg },
  primaryText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 12 },
  disabled: { opacity: 0.5 },
  secondary: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.md, minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 12 },
  message: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12, marginTop: spacing.sm },
  ruleRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm },
  ruleText: { color: colors.text, fontFamily: font.monoMedium, fontSize: 12 },
});
