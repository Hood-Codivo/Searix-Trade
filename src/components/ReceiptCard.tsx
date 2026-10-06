import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, font, radius, spacing } from '@/theme';
import type { ExecutionReceipt } from '@/types/market';

// One saved analysis. Tapping it opens the full receipt.
export function ReceiptCard({ receipt }: { receipt: ExecutionReceipt }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/receipt/${receipt.id}` as Href)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.row}>
        <Text style={styles.title}>{receipt.side === 'buy' ? 'Buy' : 'Sell'} {receipt.symbol}</Text>
        <Text style={styles.value}>${receipt.requestedUsd.toLocaleString('en-US')}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.meta}>{new Date(receipt.createdAt).toLocaleString()} · {receipt.bestVenue} · {receipt.qualityScore}/100</Text>
        <ChevronRight color={colors.textSubtle} size={16} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 14 },
  value: { color: colors.text, fontFamily: font.monoMedium, fontSize: 13 },
  meta: { color: colors.textSubtle, flex: 1, fontFamily: font.sans, fontSize: 11 },
  pressed: { opacity: 0.8 },
});
