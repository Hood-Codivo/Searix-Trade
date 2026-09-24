import { Link } from 'expo-router';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, spacing } from '@/theme';
import type { Market } from '@/types/market';
import { formatPercent, formatPrice } from '@/utils/format';
import { DepthBar } from './DepthBar';

export function MarketRow({ market }: { market: Market }) {
  const positive = market.change24h >= 0;
  return (
    <Link href={{ pathname: '/market/[id]', params: { id: market.id } }} asChild>
      <Pressable accessibilityHint="Opens market details" accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.topLine}>
          <View style={styles.identity}>
            <View style={styles.token}><Text style={styles.tokenText}>{market.base.slice(0, 1)}</Text></View>
            <View>
              <View style={styles.pairLine}><Text style={styles.base}>{market.base}</Text><Text style={styles.quote}>/{market.quote}</Text></View>
              <Text style={styles.venue}>{market.venue}</Text>
              {market.reference ? <Text style={styles.reference}>vs {market.underlyingSymbol} · {market.reference.premiumBps >= 0 ? '+' : ''}{market.reference.premiumBps.toFixed(0)} bps</Text> : null}
            </View>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.price}>{formatPrice(market.price)}</Text>
            <View style={[styles.changePill, { backgroundColor: positive ? colors.greenSoft : colors.redSoft }]}>
              {positive ? <ArrowUpRight color={colors.green} size={11} /> : <ArrowDownRight color={colors.red} size={11} />}
              <Text style={[styles.change, { color: positive ? colors.green : colors.red }]}>{formatPercent(market.change24h)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.bottomLine}>
          <Text style={styles.depthLabel}>Bid depth</Text>
          <DepthBar imbalance={market.imbalance} />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: { backgroundColor: colors.surface, borderRadius: radius.lg, gap: spacing.md, minHeight: 124, padding: spacing.lg, ...shadow.raised },
  pressed: { backgroundColor: colors.elevated, transform: [{ scale: 0.98 }] },
  topLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  identity: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.md, minWidth: 108 },
  token: { alignItems: 'center', backgroundColor: colors.amberSoft, borderColor: colors.amber, borderRadius: radius.pill, borderWidth: 1, height: 40, justifyContent: 'center', width: 40 },
  tokenText: { color: colors.amber, fontFamily: font.sansSemiBold, fontSize: 16 },
  pairLine: { alignItems: 'baseline', flexDirection: 'row' },
  base: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 15 },
  quote: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12 },
  venue: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 12, marginTop: 2 },
  reference: { color: colors.amber, fontFamily: font.mono, fontSize: 9, marginTop: 2 },
  priceBlock: { alignItems: 'flex-end', gap: 6, minWidth: 76 },
  price: { color: colors.text, fontFamily: font.monoMedium, fontSize: 15, fontVariant: ['tabular-nums'] },
  changePill: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row', gap: 2, paddingHorizontal: 8, paddingVertical: 3 },
  change: { fontFamily: font.monoMedium, fontSize: 11 },
  bottomLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  depthLabel: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11 },
});
