import { useCallback, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { marketApi } from '@/services/api';
import type { Market, WalletBalances, WalletHolding } from '@/types/market';
import { colors, font, radius, spacing } from '@/theme';
import { sellRouteFor } from '@/utils/tradeLinks';

// Mints the app can name. Anything else is shown by its mint address rather than a guessed symbol.
const KNOWN_MINTS: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  So11111111111111111111111111111111111111112: 'SOL',
  XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp: 'AAPLX',
  XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB: 'TSLAX',
  Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh: 'NVDAX',
};

const shortMint = (mint: string) => `${mint.slice(0, 4)}…${mint.slice(-4)}`;

// Your on-chain balances and what your confirmed trades add up to. Reloads every time the screen
// opens, so a trade you just made shows up. Tapping a token opens its analysis with sell selected.
export function WalletPortfolio({ address }: { address: string }) {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [holdings, setHoldings] = useState<WalletHolding[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [nextBalances, nextHoldings, nextMarkets] = await Promise.all([
        marketApi.walletBalances(address, signal),
        marketApi.walletHoldings(address, signal),
        marketApi.list(signal),
      ]);
      setBalances(nextBalances);
      setHoldings(nextHoldings);
      setMarkets(nextMarkets);
      setError(null);
    } catch (err: unknown) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : 'Could not load your balances.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [address]);

  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]));

  const openSell = (target: { mint?: string; symbol?: string }) => {
    const route = sellRouteFor(markets, target);
    if (route) router.push(route as Href);
  };

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Balance</Text>
        {loading ? <ActivityIndicator color={colors.amber} /> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {balances ? (
        <>
          <TokenRow label="SOL" value={balances.solBalance.toFixed(4)} onPress={() => openSell({ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL' })} />
          {balances.tokens.map((token) => {
            const label = KNOWN_MINTS[token.mint] ?? shortMint(token.mint);
            const sellable = label !== 'USDC';
            return (
              <TokenRow
                key={token.mint}
                label={label}
                value={token.amount.toLocaleString('en-US', { maximumFractionDigits: token.decimals })}
                onPress={sellable ? () => openSell({ mint: token.mint, symbol: label }) : undefined}
              />
            );
          })}
          {balances.tokens.length === 0 ? <Text style={styles.muted}>No token balances.</Text> : null}
        </>
      ) : null}

      <Text style={[styles.title, styles.holdingsTitle]}>Holdings</Text>
      {!loading && !error && holdings.length === 0 ? <Text style={styles.muted}>No confirmed trades yet.</Text> : null}
      {holdings.map((row) => (
        <Pressable key={row.symbol} accessibilityRole="button" onPress={() => openSell({ symbol: row.symbol })} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <View style={styles.flex}>
            <Text style={styles.asset}>{row.symbol}</Text>
            <Text style={styles.muted}>bought {row.boughtBase} · sold {row.soldBase}</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.value}>{row.netBase}</Text>
            {row.averageBuyPrice !== null ? <Text style={styles.muted}>avg ${row.averageBuyPrice}</Text> : null}
          </View>
          <ChevronRight color={colors.textSubtle} size={16} />
        </Pressable>
      ))}
    </View>
  );
}

function TokenRow({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const content = (
    <>
      <Text style={styles.asset}>{label}</Text>
      <View style={styles.right}><Text style={styles.value}>{value}</Text></View>
      {onPress ? <ChevronRight color={colors.textSubtle} size={16} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 15 },
  holdingsTitle: { marginTop: spacing.lg },
  row: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm },
  flex: { flex: 1 },
  right: { alignItems: 'flex-end' },
  asset: { color: colors.text, flex: 1, fontFamily: font.sansMedium, fontSize: 13 },
  value: { color: colors.text, fontFamily: font.monoMedium, fontSize: 13, fontVariant: ['tabular-nums'] },
  muted: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, marginTop: 2 },
  error: { color: colors.red, fontFamily: font.sans, fontSize: 12, marginTop: spacing.sm },
  pressed: { opacity: 0.7 },
});
