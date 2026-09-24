import { Link } from 'expo-router';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '@/theme';
import type { Market } from '@/types/market';
import { formatPercent, formatPrice } from '@/utils/format';
import { PriceChart } from './PriceChart';

// `market.candles` is time-evenly-spaced across all real accumulated history, not price-evenly-
// spaced -- a plain slice(-N) only looks at the most recent segment, which can legitimately be flat
// even while the market moved earlier in the window. Sampling evenly across the whole real series
// instead reflects the true shape.
function sampleEvenly(values: number[], count: number): number[] {
  if (values.length <= count) return values;
  const step = (values.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => values[Math.round(i * step)]);
}

export function MarketCard({ market, width }: { market: Market; width: number }) {
  const positive = market.change24h >= 0;
  const chartValues = sampleEvenly(market.candles, 16);
  return (
    <Link href={{ pathname: '/market/[id]', params: { id: market.id } }} asChild>
      <Pressable accessibilityHint="Opens market details" accessibilityRole="button" style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}>
        <View style={styles.identity}>
          <View style={styles.token}><Text style={styles.tokenText}>{market.base.slice(0, 1)}</Text></View>
          <View style={styles.pairColumn}>
            <Text numberOfLines={1} style={styles.base}>{market.base}</Text>
            <Text numberOfLines={1} style={styles.venue}>{market.quote}</Text>
          </View>
        </View>
        <View style={styles.chartWrap}>
          <PriceChart height={88} values={chartValues} width={width - spacing.lg * 2} />
        </View>
        <Text style={styles.price}>{formatPrice(market.price)}</Text>
        <View style={[styles.changePill, { backgroundColor: positive ? colors.greenSoft : colors.redSoft }]}>
          {positive ? <ArrowUpRight color={colors.green} size={11} /> : <ArrowDownRight color={colors.red} size={11} />}
          <Text style={[styles.change, { color: positive ? colors.green : colors.red }]}>{formatPercent(market.change24h)}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, ...shadow.raised },
  pressed: { backgroundColor: colors.elevated, transform: [{ scale: 0.98 }] },
  identity: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  token: { alignItems: 'center', backgroundColor: colors.amberSoft, borderRadius: radius.pill, height: 32, justifyContent: 'center', width: 32 },
  tokenText: { color: colors.amber, fontFamily: font.sansSemiBold, fontSize: 13 },
  pairColumn: { flex: 1 },
  base: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14 },
  venue: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11 },
  chartWrap: { marginTop: spacing.sm },
  price: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 20, fontVariant: ['tabular-nums'], marginTop: spacing.sm },
  changePill: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, flexDirection: 'row', gap: 2, marginTop: 6, paddingHorizontal: 8, paddingVertical: 3 },
  change: { fontFamily: font.monoMedium, fontSize: 11 },
});
