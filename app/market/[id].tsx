import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Info, Radio, ShieldCheck, Star } from 'lucide-react-native';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AssetRegistryCard } from '@/components/AssetRegistryCard';
import { DepthChart } from '@/components/DepthChart';
import { ExecutionLab } from '@/components/ExecutionLab';
import { MetricTile } from '@/components/MetricTile';
import { PriceChart } from '@/components/PriceChart';
import { QualityBadge } from '@/components/QualityBadge';
import { useCandles, useMarket } from '@/hooks/useMarkets';
import { colors, font, radius, shadow, spacing } from '@/theme';
import { formatCompactUsd, formatPercent, formatPrice } from '@/utils/format';
import type { CandleRange } from '@/types/market';

type ChartTab = 'Price' | 'Depth';

// Real accumulated price history is currently shorter than a week (the service hasn't been running
// that long), so 1h/1d/1w/1m would silently return identical data for any window wider than actual
// uptime -- a row of buttons that don't differentiate anything looks broken even though the data
// behind it is real. One honest "everything we've observed" range instead of four fake-looking ones.
const CANDLE_RANGE: CandleRange = '1m';

export default function MarketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: market, error, loading, retry } = useMarket(id);
  const [chartTab, setChartTab] = useState<ChartTab>('Price');
  const { data: candles } = useCandles(id, CANDLE_RANGE);
  const [chartWidth, setChartWidth] = useState(340);
  const measure = (event: LayoutChangeEvent) => setChartWidth(event.nativeEvent.layout.width);

  if (loading) return <SafeAreaView style={styles.safe}><View style={styles.notFound}><Text style={styles.notFoundTitle}>Loading market</Text><Text style={styles.ticketCopy}>Checking the latest market snapshot.</Text></View></SafeAreaView>;
  if (!market) return <SafeAreaView style={styles.safe}><View style={styles.notFound}><Text style={styles.notFoundTitle}>Couldn’t load market</Text><Text style={styles.ticketCopy}>{error ?? 'That market is not being tracked.'}</Text><Pressable onPress={retry} style={styles.secondaryButton}><Text style={styles.secondaryText}>Try again</Text></Pressable><Pressable onPress={() => router.back()} style={styles.secondaryButton}><Text style={styles.secondaryText}>Go back</Text></Pressable></View></SafeAreaView>;
  const positive = market.change24h >= 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.nav}><Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><ArrowLeft color={colors.text} size={21} /></Pressable><View style={styles.navTitle}><Text style={styles.pair}>{market.base}/{market.quote}</Text><View style={styles.venueLine}><Radio color={colors.green} size={11} /><Text style={styles.venue}>{market.venue} · Mainnet</Text></View></View><Pressable accessibilityLabel="Add market to watchlist" style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Star color={colors.text} size={20} /></Pressable></View>
        <View style={styles.priceCard}>
          <View style={styles.priceLine}><View><Text style={styles.price}>{formatPrice(market.price)}</Text><Text style={[styles.change, { color: positive ? colors.green : colors.red }]}>{positive ? '▲' : '▼'} {formatPercent(market.change24h)} · 24h</Text></View><QualityBadge label={market.quality.label} tone={market.quality.tone} /></View>
          <View style={styles.marketMeta}><Text style={styles.marketMetaText}>{formatCompactUsd(market.volume24h)} volume</Text><View style={styles.metaDot} /><Text style={styles.marketMetaText}>{market.spreadBps.toFixed(1)} bps spread</Text></View>
        </View>

        <View onLayout={measure} style={styles.chartCard}>
          <View accessibilityRole="tablist" style={styles.tabs}>{(['Price', 'Depth'] as ChartTab[]).map((tab) => <Pressable accessibilityRole="tab" accessibilityState={{ selected: chartTab === tab }} key={tab} onPress={() => setChartTab(tab)} style={[styles.tab, chartTab === tab && styles.activeTab]}><Text style={[styles.tabText, chartTab === tab && styles.activeTabText]}>{tab}</Text></Pressable>)}</View>
          {chartTab === 'Price' ? <PriceChart values={candles.length > 0 ? candles : market.candles} width={Math.max(280, chartWidth - 32)} /> : <DepthChart asks={market.asks} bids={market.bids} width={Math.max(280, chartWidth - 32)} />}
          {chartTab === 'Price' ? <Text style={styles.rangeNote}>Full real price history observed since this market started tracking.</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Execution quality</Text>
        <View style={styles.metrics}>
          <MetricTile label="Effective spread" value={`${market.spreadBps.toFixed(1)} bps`} detail="Tight at the midpoint" />
          <MetricTile label="Depth ±1%" value={formatCompactUsd(market.depthUsd)} detail="Combined executable depth" />
          <MetricTile label="24h volume" value={formatCompactUsd(market.volume24h)} detail="Across Solana" />
          <MetricTile label="Quality score" value={`${market.quality.score}/100`} detail="Model v0.1 · preview" />
        </View>

        <View style={[styles.fairnessCard, { borderColor: market.quality.tone === 'caution' ? colors.red : colors.green }]}>
          <View style={styles.fairnessTitleLine}><ShieldCheck color={market.quality.tone === 'caution' ? colors.red : colors.green} size={20} /><Text style={styles.fairnessTitle}>Fill fairness check</Text><Info color={colors.textSubtle} size={16} /></View>
          <Text style={styles.fairnessCopy}>{market.quality.summary}</Text>
          <Text style={styles.disclaimer}>This is a market signal, not proof of manipulation or financial advice.</Text>
        </View>

        <ExecutionLab market={market} />
        {market.assetClass === 'tokenized-stock' ? <AssetRegistryCard symbol={market.base} /> : null}

        <View style={styles.endNote}><Text style={styles.endNoteTitle}>Built for better fills</Text><Text style={styles.endNoteCopy}>Analysis uses the latest visible order book. It is an estimate, not a guaranteed execution price.</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 }, content: { padding: spacing.lg },
  nav: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, iconButton: { alignItems: 'center', borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  navTitle: { alignItems: 'center' }, pair: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 16 }, venueLine: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 }, venue: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11 },
  priceCard: { backgroundColor: colors.surface, borderRadius: radius.xl, marginTop: spacing.xl, padding: spacing.lg, ...shadow.raised }, priceLine: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' }, price: { color: colors.text, fontFamily: font.monoMedium, fontSize: 36, fontVariant: ['tabular-nums'], letterSpacing: -1 }, change: { fontFamily: font.mono, fontSize: 12, marginTop: 5 }, marketMeta: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, paddingTop: spacing.md }, marketMetaText: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 10 }, metaDot: { backgroundColor: colors.borderStrong, borderRadius: 2, height: 3, width: 3 },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius.xl, marginTop: spacing.xl, overflow: 'hidden', padding: spacing.lg, ...shadow.raised }, tabs: { alignSelf: 'flex-start', backgroundColor: colors.elevated, borderRadius: radius.pill, flexDirection: 'row', marginBottom: spacing.md, padding: 3 }, tab: { alignItems: 'center', borderRadius: radius.pill, justifyContent: 'center', minHeight: 36, paddingHorizontal: spacing.lg }, activeTab: { backgroundColor: colors.borderStrong }, tabText: { color: colors.textMuted, fontFamily: font.sansMedium, fontSize: 12 }, activeTabText: { color: colors.text },
  rangeNote: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, marginTop: spacing.md },
  sectionTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 17, marginBottom: spacing.md, marginTop: spacing.xl }, metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fairnessCard: { backgroundColor: colors.surface, borderLeftWidth: 3, borderRadius: radius.md, marginTop: spacing.xl, padding: spacing.lg }, fairnessTitleLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, fairnessTitle: { color: colors.text, flex: 1, fontFamily: font.sansSemiBold, fontSize: 15 }, fairnessCopy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, lineHeight: 20, marginTop: spacing.sm }, disclaimer: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, lineHeight: 16, marginTop: spacing.md },
  endNote: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl }, endNoteTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 13 }, endNoteCopy: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, lineHeight: 17, marginTop: spacing.xs, textAlign: 'center' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  ticketCopy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  secondaryButton: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: radius.md, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.lg }, secondaryText: { color: colors.text, fontFamily: font.sansMedium, fontSize: 14 }, notFound: { alignItems: 'center', flex: 1, gap: spacing.lg, justifyContent: 'center', padding: spacing.xl }, notFoundTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 20 },
});
