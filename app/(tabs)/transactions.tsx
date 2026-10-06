import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftRight, ExternalLink } from 'lucide-react-native';
import { useWallet } from '@/context/WalletProvider';
import { marketApi } from '@/services/api';
import { colors, font, radius, spacing } from '@/theme';
import type { ExecutionReceipt } from '@/types/market';
import { formatCompactUsd } from '@/utils/format';

// Your confirmed on-chain trades, newest first. Only trades the backend verified appear here.
export default function TransactionsScreen() {
  const { status, account, connect } = useWallet();
  const [trades, setTrades] = useState<ExecutionReceipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const address = status === 'connected' ? account?.address : undefined;

  const load = useCallback((signal?: AbortSignal) => {
    if (!address) return;
    setLoading(true);
    marketApi.walletExecutions(address, signal)
      .then((next) => { setTrades(next); setError(null); })
      .catch((err: unknown) => { if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Could not load transactions.'); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [address]);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]));

  useEffect(() => { if (!address) setTrades([]); }, [address]);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.content}
        data={address && !loading && !error ? trades : []}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>ON-CHAIN</Text>
            <Text style={styles.title}>Transactions</Text>
            <Text style={styles.copy}>Every buy and sell your wallet has confirmed on Solana mainnet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.top}>
              <View style={styles.icon}><ArrowLeftRight color={colors.amber} size={16} /></View>
              <View style={styles.flex}>
                <Text style={styles.pair}>{item.side === 'buy' ? 'Bought' : 'Sold'} {item.symbol}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()} · {item.bestVenue}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>{item.actualBaseAmount ?? '—'} {item.symbol}</Text>
                <Text style={styles.date}>{item.actualFilledUsd !== null ? formatCompactUsd(item.actualFilledUsd) : '—'}</Text>
              </View>
            </View>
            {item.transactionSignature ? (
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`https://solscan.io/tx/${item.transactionSignature}`)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
                <ExternalLink color={colors.blue} size={13} />
                <Text style={styles.linkText}>View on Solscan</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          loading ? <View style={styles.state}><ActivityIndicator color={colors.amber} /></View>
          : error ? <View style={styles.state}><Text style={styles.stateTitle}>Couldn’t load transactions</Text><Text style={styles.copy}>{error}</Text></View>
          : !address ? <View style={styles.state}><Text style={styles.stateTitle}>Connect a wallet</Text><Text style={styles.copy}>Your trades appear here once a wallet is connected.</Text><Pressable accessibilityRole="button" onPress={connect} style={styles.action}><Text style={styles.actionText}>Connect wallet</Text></Pressable></View>
          : <View style={styles.state}><Text style={styles.stateTitle}>No transactions yet</Text><Text style={styles.copy}>Confirmed trades from this wallet will show up here.</Text></View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 }, content: { padding: spacing.lg, paddingBottom: spacing.xxl }, header: { paddingBottom: spacing.xl },
  eyebrow: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1.1 }, title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 30, letterSpacing: -0.8, marginTop: spacing.sm },
  copy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, padding: spacing.lg },
  top: { alignItems: 'center', flexDirection: 'row' }, icon: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: radius.md, height: 36, justifyContent: 'center', width: 36 },
  flex: { flex: 1, marginLeft: spacing.md }, right: { alignItems: 'flex-end' },
  pair: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14 }, amount: { color: colors.text, fontFamily: font.monoMedium, fontSize: 13 },
  date: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 9, marginTop: 3 },
  link: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md }, linkText: { color: colors.blue, fontFamily: font.sansMedium, fontSize: 12 },
  state: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.xxl },
  stateTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 15 },
  action: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: radius.md, justifyContent: 'center', marginTop: spacing.sm, minHeight: 44, paddingHorizontal: spacing.lg }, actionText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 12 },
  pressed: { opacity: 0.8 },
});
