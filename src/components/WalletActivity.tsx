import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { marketApi } from '@/services/api';
import type { ExecutionReceipt, WalletHolding } from '@/types/market';
import { colors, font, radius, spacing } from '@/theme';

// Your confirmed trades and what they add up to. Everything here comes from on-chain fills the backend
// verified, so a trade that never landed on-chain doesn't appear.
export function WalletActivity({ address }: { address: string }) {
  const [holdings, setHoldings] = useState<WalletHolding[]>([]);
  const [trades, setTrades] = useState<ExecutionReceipt[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([marketApi.walletHoldings(address, controller.signal), marketApi.walletExecutions(address, controller.signal)])
      .then(([nextHoldings, nextTrades]) => {
        setHoldings(nextHoldings);
        setTrades(nextTrades);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Could not load your activity.');
      });
    return () => controller.abort();
  }, [address]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Your holdings</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {holdings.length === 0 && !error ? <Text style={styles.muted}>No confirmed trades yet for this wallet.</Text> : null}
      {holdings.map((row) => (
        <View key={row.symbol} style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.asset}>{row.symbol}</Text>
            <Text style={styles.muted}>bought {row.boughtBase} · sold {row.soldBase}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.value}>{row.netBase} {row.symbol}</Text>
            {row.averageBuyPrice !== null ? <Text style={styles.muted}>avg buy ${row.averageBuyPrice}</Text> : null}
          </View>
        </View>
      ))}

      {trades.length > 0 ? <Text style={[styles.title, styles.historyTitle]}>Trade history</Text> : null}
      {trades.map((trade) => (
        <View key={trade.id} style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.asset}>{trade.side === 'buy' ? 'Bought' : 'Sold'} {trade.symbol}</Text>
            <Text style={styles.muted}>{new Date(trade.createdAt).toLocaleString()} · {trade.bestVenue}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.value}>{trade.actualBaseAmount ?? '—'} {trade.symbol}</Text>
            <Text style={styles.muted}>${trade.actualFilledUsd?.toFixed(2) ?? '—'}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, marginTop: spacing.lg, padding: spacing.md },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14 },
  historyTitle: { marginTop: spacing.lg },
  row: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', marginTop: spacing.sm, paddingTop: spacing.sm },
  flex: { flex: 1 },
  right: { alignItems: 'flex-end' },
  asset: { color: colors.text, fontFamily: font.sansMedium, fontSize: 13 },
  value: { color: colors.text, fontFamily: font.monoMedium, fontSize: 12 },
  muted: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, marginTop: 2 },
  error: { color: colors.red, fontFamily: font.sans, fontSize: 12, marginTop: spacing.sm },
});
