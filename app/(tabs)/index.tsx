import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Binoculars,
  CircleUserRound,
  FileCheck2,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MarketRow } from "@/components/MarketRow";
import { useMarkets } from "@/hooks/useMarkets";
import { colors, font, radius, shadow, spacing } from "@/theme";
import { formatPercent } from "@/utils/format";

const TICKER_IDS = ["aaplx-usdc", "tslax-usdc", "nvdax-usdc"];

const QUICK_ACTIONS = [
  { label: "Watchlist", Icon: Binoculars, href: "/(tabs)/watchlist" as const },
  { label: "Receipts", Icon: FileCheck2, href: "/(tabs)/receipts" as const },
  { label: "Alerts", Icon: Bell, href: "/(tabs)/alerts" as const },
];

export default function MarketsScreen() {
  const [query, setQuery] = useState("");
  const { data: markets, error, loading, retry } = useMarkets();

  const filtered = useMemo(
    () =>
      markets.filter((market) =>
        `${market.base}/${market.quote}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [markets, query],
  );

  const tickers = useMemo(
    () => TICKER_IDS.map((id) => markets.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [markets],
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.content}
        data={error || loading ? [] : filtered}
        keyExtractor={(market) => market.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.topBar}>
              <View style={styles.brandLine}>
                <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.brandMark}>
                  <TrendingUp color="#FFFFFF" size={18} />
                </LinearGradient>
                <Text style={styles.brandText}>Searix Trade</Text>
              </View>
              <View style={styles.topActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push("/(tabs)/receipts")}
                  style={({ pressed }) => [styles.portfolioPill, pressed && styles.controlPressed]}
                >
                  <Text style={styles.portfolioPillText}>Portfolio</Text>
                </Pressable>
                <Pressable
                  accessibilityLabel="Open profile"
                  onPress={() => router.push("/(tabs)/profile")}
                  style={({ pressed }) => [styles.avatarButton, pressed && styles.controlPressed]}
                >
                  <CircleUserRound color={colors.text} size={22} />
                </Pressable>
              </View>
            </View>

            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.heroCard}
            >
              <Text style={styles.heroTitle}>Market depth,{"\n"}made clear.</Text>
              <Text style={styles.heroSubtitle}>Compare liquidity and execution quality before you place an order.</Text>
              {tickers.length > 0 ? (
                <View style={styles.tickerRow}>
                  {tickers.map((market) => {
                    const positive = market.change24h >= 0;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={market.id}
                        onPress={() => router.push({ pathname: "/market/[id]", params: { id: market.id } })}
                        style={({ pressed }) => [styles.tickerChip, pressed && styles.controlPressed]}
                      >
                        <View style={styles.tickerToken}><Text style={styles.tickerTokenText}>{market.base.slice(0, 1)}</Text></View>
                        <View>
                          <Text style={styles.tickerLabel}>{market.underlyingSymbol ?? market.base}</Text>
                          <View style={styles.tickerChangeLine}>
                            {positive ? <ArrowUpRight color={colors.green} size={10} /> : <ArrowDownRight color={colors.red} size={10} />}
                            <Text style={[styles.tickerChange, { color: positive ? colors.green : colors.red }]}>{formatPercent(market.change24h)}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </LinearGradient>

            <View style={styles.quickActions}>
              {QUICK_ACTIONS.map(({ label, Icon, href }) => (
                <Pressable
                  accessibilityRole="button"
                  key={label}
                  onPress={() => router.push(href)}
                  style={({ pressed }) => [styles.quickAction, pressed && styles.controlPressed]}
                >
                  <Text style={styles.quickActionText}>{label}</Text>
                  <Icon color={colors.text} size={16} />
                </Pressable>
              ))}
            </View>

            <View style={styles.controls}>
              <View style={styles.searchBox}>
                <Search color={colors.textSubtle} size={18} />
                <TextInput
                  accessibilityLabel="Search markets"
                  autoCapitalize="characters"
                  onChangeText={setQuery}
                  placeholder="Search markets"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                  value={query}
                />
              </View>
              <Pressable
                accessibilityLabel="Filter markets"
                style={({ pressed }) => [
                  styles.filterButton,
                  pressed && styles.controlPressed,
                ]}
              >
                <SlidersHorizontal color={colors.text} size={19} />
              </Pressable>
            </View>
            <View style={styles.sectionLine}>
              <Text style={styles.sectionTitle}>Active markets</Text>
              <Text style={styles.count}>{filtered.length} markets</Text>
            </View>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          loading ? (
            <View accessibilityLiveRegion="polite" style={styles.stateCard}>
              <ActivityIndicator color={colors.amber} />
              <Text style={styles.stateTitle}>Refreshing markets</Text>
              <Text style={styles.stateCopy}>
                Checking the latest market snapshots.
              </Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Couldn’t load markets</Text>
              <Text style={styles.stateCopy}>
                {error} Your funds are unaffected.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>No matching market</Text>
              <Text style={styles.stateCopy}>
                Try a symbol such as AAPLX, TSLAX, SOL, or JUP.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setQuery("")}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Clear search</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item }) => <MarketRow market={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  headerWrap: { paddingBottom: spacing.lg, paddingTop: spacing.md },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brandLine: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  brandMark: { alignItems: "center", borderRadius: radius.pill, height: 36, justifyContent: "center", width: 36 },
  brandText: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 16 },
  topActions: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  portfolioPill: { alignItems: "center", borderColor: colors.borderStrong, borderRadius: radius.pill, borderWidth: 1, justifyContent: "center", minHeight: 36, paddingHorizontal: spacing.md },
  portfolioPillText: { color: colors.text, fontFamily: font.sansMedium, fontSize: 12 },
  avatarButton: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.pill, height: 36, justifyContent: "center", width: 36, ...shadow.raised },
  heroCard: {
    borderRadius: radius.xl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  heroTitle: {
    color: colors.textInverse,
    fontFamily: font.sansExtraBold,
    fontSize: 30,
    letterSpacing: -1,
    lineHeight: 36,
  },
  heroSubtitle: {
    color: "rgba(244,241,232,0.78)",
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
    maxWidth: 300,
  },
  tickerRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  tickerChip: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, flex: 1, flexDirection: "row", gap: spacing.xs, padding: spacing.sm },
  tickerToken: { alignItems: "center", backgroundColor: colors.amberSoft, borderRadius: radius.pill, height: 24, justifyContent: "center", width: 24 },
  tickerTokenText: { color: colors.amber, fontFamily: font.sansSemiBold, fontSize: 11 },
  tickerLabel: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 11 },
  tickerChangeLine: { alignItems: "center", flexDirection: "row", gap: 1, marginTop: 1 },
  tickerChange: { fontFamily: font.monoMedium, fontSize: 10 },
  quickActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  quickAction: { alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.pill, flex: 1, flexDirection: "row", gap: spacing.xs, justifyContent: "center", minHeight: 46, ...shadow.raised },
  quickActionText: { color: colors.text, fontFamily: font.sansMedium, fontSize: 13 },
  controls: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: font.sans,
    fontSize: 14,
    height: 48,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  controlPressed: {
    backgroundColor: colors.elevated,
    transform: [{ scale: 0.97 }],
  },
  sectionLine: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: font.sansSemiBold,
    fontSize: 17,
  },
  count: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 11 },
  stateCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.xxl,
  },
  stateTitle: {
    color: colors.text,
    fontFamily: font.sansSemiBold,
    fontSize: 16,
  },
  stateCopy: {
    color: colors.textMuted,
    fontFamily: font.sans,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: colors.amber,
    borderRadius: radius.md,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    color: colors.canvas,
    fontFamily: font.sansSemiBold,
    fontSize: 14,
  },
});
