import { useCallback, useState } from 'react';
import { router, useFocusEffect, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { marketApi } from '@/services/api';
import type { Market, PositionPnl, WalletBalances } from '@/types/market';
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

// Your real on-chain balance, one list, nothing else claiming to be a second source of truth. P&L is
// shown inline per token when there's trade history to compute it from. For a buy/sell history, see the
// Transactions tab -- this used to also show a separate "Holdings" breakdown built from Searix's own
// receipts, which went stale the moment a trade happened outside the app; simpler to just show the chain.
export function WalletPortfolio({ address }: { address: string }) {
  const [balances, setBalances] = useState<WalletBalances | null>(null);
  const [pnl, setPnl] = useState<PositionPnl[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [nextBalances, nextMarkets, nextPnl] = await Promise.all([
        marketApi.walletBalances(address, signal),
        marketApi.list(signal),
        marketApi.walletPnl(address, signal),
      ]);
      setBalances(nextBalances);
      setMarkets(nextMarkets);
      setPnl(nextPnl);
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
          <TokenRow label="SOL" value={balances.solBalance.toFixed(4)} pnl={pnl.find((item) => item.symbol === 'SOL')} onPress={() => openSell({ mint: 'So11111111111111111111111111111111111111112', symbol: 'SOL' })} />
          {balances.tokens.map((token) => {
            const label = KNOWN_MINTS[token.mint] ?? shortMint(token.mint);
            const sellable = label !== 'USDC';
            return (
              <TokenRow
                key={token.mint}
                label={label}
                value={token.amount.toLocaleString('en-US', { maximumFractionDigits: token.decimals })}
                pnl={pnl.find((item) => item.symbol === label)}
                onPress={sellable ? () => openSell({ mint: token.mint, symbol: label }) : undefined}
              />
            );
          })}
          {balances.tokens.length === 0 ? <Text style={styles.muted}>No token balances.</Text> : null}
        </>
      ) : null}
      {pnl.length > 0 ? <Text style={styles.footnote}>Profit and loss, from trades made through the app. For your full buy/sell history, see the Transactions tab.</Text> : null}
    </View>
  );
}

function TokenRow({ label, value, pnl, onPress }: { label: string; value: string; pnl?: PositionPnl; onPress?: () => void }) {
  const unrealized = pnl?.unrealizedPnlUsd ?? null;
  const content = (
    <>
      <Text style={styles.asset}>{label}</Text>
      <View style={styles.right}>
        <Text style={styles.value}>{value}</Text>
        {unrealized !== null ? (
          <Text style={[styles.pnl, { color: unrealized >= 0 ? colors.green : colors.red }]}>
            {unrealized >= 0 ? '+' : '-'}${Math.abs(unrealized).toFixed(2)} unrealized
          </Text>
        ) : null}
      </View>
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
  row: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm },
  right: { alignItems: 'flex-end' },
  asset: { color: colors.text, flex: 1, fontFamily: font.sansMedium, fontSize: 13 },
  value: { color: colors.text, fontFamily: font.monoMedium, fontSize: 13, fontVariant: ['tabular-nums'] },
  muted: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, marginTop: 2 },
  pnl: { fontFamily: font.monoMedium, fontSize: 11, marginTop: 2 },
  footnote: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, lineHeight: 15, marginTop: spacing.md },
  error: { color: colors.red, fontFamily: font.sans, fontSize: 12, marginTop: spacing.sm },
  pressed: { opacity: 0.7 },
});
