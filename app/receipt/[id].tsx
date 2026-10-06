import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ExternalLink } from 'lucide-react-native';
import { useReceipts } from '@/hooks/useMarkets';
import { colors, font, radius, spacing } from '@/theme';
import { formatPrice } from '@/utils/format';

// Full detail of one saved analysis, with its on-chain transaction when there is one.
export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading } = useReceipts();
  const receipt = data.find((item) => item.id === id);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}>
          <ArrowLeft color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.title}>Receipt</Text>
      </View>
      {!receipt ? (
        <Text style={styles.copy}>{loading ? 'Loading receipt…' : 'This receipt could not be found.'}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>{receipt.verified ? 'VERIFIED ON-CHAIN' : 'ANALYSIS · NOT EXECUTED'}</Text>
          <Text style={styles.pair}>{receipt.side === 'buy' ? 'Buy' : 'Sell'} {receipt.symbol}</Text>
          <Text style={styles.copy}>{new Date(receipt.createdAt).toLocaleString()}</Text>

          <Section title="Order">
            <Row label="Requested" value={`$${receipt.requestedUsd.toLocaleString('en-US')}`} />
            <Row label="Best venue" value={receipt.bestVenue} />
            <Row label="Expected price" value={formatPrice(receipt.expectedAveragePrice)} />
            <Row label="Expected amount" value={receipt.expectedBaseAmount ? `${receipt.expectedBaseAmount} ${receipt.symbol}` : '—'} />
            <Row label="Price impact" value={`${receipt.expectedImpactBps.toFixed(1)} bps`} />
            <Row label="Quality score" value={`${receipt.qualityScore}/100`} />
          </Section>

          {receipt.verified ? (
            <Section title="Executed">
              <Row label="Filled amount" value={receipt.actualBaseAmount !== null ? `${receipt.actualBaseAmount} ${receipt.symbol}` : '—'} />
              <Row label="Filled USD" value={receipt.actualFilledUsd !== null ? `$${receipt.actualFilledUsd.toFixed(2)}` : '—'} />
              <Row label="Actual price" value={receipt.actualAveragePrice !== null ? formatPrice(receipt.actualAveragePrice) : '—'} />
              <Row label="Network" value={receipt.network ?? '—'} />
              <Row label="Fee" value={`${receipt.phoenixFeeBps} bps · ${receipt.feeStatus}`} />
            </Section>
          ) : null}

          {receipt.benchmarkPrice !== null ? (
            <Section title="Benchmark">
              <Row label="Underlying price" value={formatPrice(receipt.benchmarkPrice)} />
              {receipt.premiumBps !== null ? <Row label="Premium" value={`${receipt.premiumBps.toFixed(1)} bps`} /> : null}
            </Section>
          ) : null}

          {receipt.transactionSignature ? (
            <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`https://solscan.io/tx/${receipt.transactionSignature}`)} style={({ pressed }) => [styles.link, pressed && styles.pressed]}>
              <ExternalLink color={colors.blue} size={14} />
              <Text style={styles.linkText}>View transaction on Solscan</Text>
            </Pressable>
          ) : null}

          <Text style={styles.hash}>{receipt.id}</Text>
          <Text style={styles.hash}>Content hash {receipt.contentHash}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.canvas, flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
  back: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 20 },
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  eyebrow: { color: colors.amber, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1.1 },
  pair: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 26, marginTop: spacing.xs },
  copy: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13, marginTop: spacing.xs, paddingHorizontal: spacing.lg },
  section: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.lg, padding: spacing.lg },
  sectionTitle: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14, marginBottom: spacing.sm },
  row: { borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  label: { color: colors.textMuted, fontFamily: font.sans, fontSize: 13 },
  value: { color: colors.text, fontFamily: font.monoMedium, fontSize: 13 },
  link: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  linkText: { color: colors.blue, fontFamily: font.sansMedium, fontSize: 13 },
  hash: { color: colors.textSubtle, fontFamily: font.mono, fontSize: 9, marginTop: spacing.md },
  pressed: { opacity: 0.8 },
});
