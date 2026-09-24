import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, ExternalLink } from 'lucide-react-native';
import { useRegistryEntry } from '@/hooks/useMarkets';
import { colors, font, radius, spacing } from '@/theme';
import { formatAddress } from '@/utils/format';

export function AssetRegistryCard({ symbol }: { symbol: string }) {
  const { data: entry, loading } = useRegistryEntry(symbol);
  if (loading || !entry) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headingLine}>
        <View style={styles.iconWell}><BadgeCheck color={colors.blue} size={18} /></View>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>VERIFIED REGISTRY</Text>
          <Text style={styles.title}>{entry.name}</Text>
        </View>
      </View>

      <Row label="Issuer" value={entry.issuer} />
      <Row label="Custody" value={entry.custody} />
      <Row label="Backing" value={entry.backingRatio} />
      <Row label="Redemption" value={entry.redemption} />
      <Row label="Jurisdiction" value={entry.jurisdictionRestrictions} />
      <Row label="Regulatory framework" value={entry.regulatoryFramework} />
      <Row label="Trading venues" value={entry.tradingVenues.join(', ')} />
      <Row label="Mint" value={formatAddress(entry.mint)} mono />

      <View style={styles.sources}>
        <Text style={styles.sourcesLabel}>SOURCES</Text>
        {entry.sources.map((source) => (
          <Pressable accessibilityRole="link" key={source.url} onPress={() => Linking.openURL(source.url)} style={styles.sourceRow}>
            <ExternalLink color={colors.blue} size={12} />
            <Text style={styles.sourceText}>{source.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.rowValueMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: radius.lg, borderWidth: 1, marginTop: spacing.xl, padding: spacing.lg },
  headingLine: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.md },
  iconWell: { alignItems: 'center', backgroundColor: colors.whiteSoft, borderRadius: radius.md, height: 38, justifyContent: 'center', width: 38 },
  headingCopy: { marginLeft: spacing.md },
  eyebrow: { color: colors.blue, fontFamily: font.monoMedium, fontSize: 10, letterSpacing: 1 },
  title: { color: colors.text, fontFamily: font.sansSemiBold, fontSize: 16, marginTop: 2 },
  row: { borderTopColor: colors.border, borderTopWidth: 1, paddingVertical: spacing.md },
  rowLabel: { color: colors.textSubtle, fontFamily: font.sansMedium, fontSize: 10, letterSpacing: 0.4, marginBottom: 4, textTransform: 'uppercase' },
  rowValue: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12, lineHeight: 18 },
  rowValueMono: { fontFamily: font.mono },
  sources: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: spacing.xs, paddingTop: spacing.md },
  sourcesLabel: { color: colors.textSubtle, fontFamily: font.monoMedium, fontSize: 9, letterSpacing: 0.6, marginBottom: spacing.sm },
  sourceRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, paddingVertical: 4 },
  sourceText: { color: colors.blue, fontFamily: font.sansMedium, fontSize: 11 },
});
