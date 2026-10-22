import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Binoculars } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMarkets, useWatchlist } from '@/hooks/useMarkets';
import { useWallet } from '@/context/WalletProvider';
import { useTheme } from '@/context/ThemeProvider';
import { MarketRow } from '@/components/MarketRow';
import { EmptyTab } from '@/components/EmptyTab';
import { font, spacing } from '@/theme';

// Markets the connected wallet starred from the market detail screen. Saving is per-wallet and
// lives on the backend (so it follows the wallet across devices), not just on this phone.
export default function Watchlist() {
  const { account, status, connect } = useWallet();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { data: markets, loading: marketsLoading } = useMarkets();
  const { data: entries, error, loading, retry } = useWatchlist();

  if (!account) {
    return (
      <EmptyTab
        Icon={Binoculars}
        title="Connect a wallet to save markets"
        copy="Your watchlist follows your wallet across devices -- connect to start saving markets you want to monitor."
        action={status === 'connecting' ? 'Connecting…' : 'Connect wallet'}
        onAction={connect}
      />
    );
  }

  const saved = markets.filter((market) => entries.some((entry) => entry.marketId === market.id));

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.content}
        data={saved}
        keyExtractor={(market) => market.id}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>SAVED</Text>
            <Text style={styles.title}>Watchlist</Text>
          </View>
        }
        ListEmptyComponent={
          loading || marketsLoading ? (
            <View style={styles.state}><ActivityIndicator color={colors.amber} /></View>
          ) : error ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Couldn’t load your watchlist</Text>
              <Text style={styles.stateCopy}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={retry} style={styles.retryButton}><Text style={styles.retryText}>Try again</Text></Pressable>
            </View>
          ) : (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Your watchlist is clear</Text>
              <Text style={styles.stateCopy}>Save markets you want to monitor -- tap the star on any market's page.</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)')} style={styles.retryButton}><Text style={styles.retryText}>Browse markets</Text></Pressable>
            </View>
          )
        }
        renderItem={({ item }) => <MarketRow market={item} />}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { paddingBottom: spacing.xl },
  eyebrow: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1.1 },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 30, letterSpacing: -0.8, marginTop: spacing.sm },
  state: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: spacing.sm, padding: spacing.xxl },
  stateTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 16 },
  stateCopy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: { alignItems: 'center', backgroundColor: colors.amber, borderRadius: 12, justifyContent: 'center', marginTop: spacing.sm, minHeight: 44, paddingHorizontal: spacing.lg },
  retryText: { color: colors.canvas, fontFamily: font.sansSemiBold, fontSize: 14 },
});
