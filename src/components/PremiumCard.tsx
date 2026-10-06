import { StyleSheet, Text, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme';
import type { Market } from '@/types/market';
import { formatPrice } from '@/utils/format';

// How far the tokenized stock trades from the real share price it tracks. A premium means the token is
// dearer than the share; a discount means cheaper. Only shown when a live reference exists.
export function PremiumCard({ market }: { market: Market }) {
  const reference = market.reference;
  if (!reference || !reference.isLive || !market.underlyingSymbol) return null;
  const premium = reference.premiumBps / 100;
  const above = premium >= 0;
  const Arrow = above ? ArrowUpRight : ArrowDownRight;
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>PREMIUM VS UNDERLYING</Text>
      <View style={styles.headline}>
        <Arrow color={above ? colors.amber : colors.green} size={20} />
        <Text style={styles.value}>{above ? '+' : ''}{premium.toFixed(2)}%</Text>
        <Text style={styles.copy}>{market.base} {above ? 'trades above' : 'trades below'} {market.underlyingSymbol}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{market.base}</Text>
        <Text style={styles.price}>{formatPrice(reference.tokenPrice)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{market.underlyingSymbol} share</Text>
        <Text style={styles.price}>{formatPrice(reference.underlyingPrice)}</Text>
      </View>
      <Text style={styles.foot}>Market {reference.marketState}. Premiums move with the share price and can close fast when the market opens.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: 1, marginTop: spacing.xl, padding: spacing.lg },
  eyebrow: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1.1 },
  headline: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  value: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 24 },
  copy: { color: colors.textMuted, flex: 1, fontFamily: font.sans, fontSize: 12 },
  row: { borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.sm },
  label: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13 },
  price: { color: colors.text, fontFamily: font.monoMedium, fontSize: 13 },
  foot: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, lineHeight: 16, marginTop: spacing.md },
});
