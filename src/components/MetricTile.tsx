import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { font, radius, shadow, spacing } from '@/theme';

export function MetricTile({ label, value, detail, icon }: { label: string; value: string; detail: string; icon?: ReactNode }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={styles.tile}><View style={styles.labelLine}>{icon}<Text style={styles.label}>{label}</Text></View><Text style={styles.value}>{value}</Text><Text style={styles.detail}>{detail}</Text></View>;
}
const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({ tile: { backgroundColor: colors.surface, borderRadius: radius.lg, flex: 1, minWidth: 150, padding: spacing.md, ...shadow.raised }, labelLine: { alignItems: 'center', flexDirection: 'row', gap: 6 }, label: { color: colors.textMuted, fontFamily: font.sans, fontSize: 12 }, value: { color: colors.text, fontFamily: font.monoMedium, fontSize: 19, fontVariant: ['tabular-nums'], marginTop: spacing.sm }, detail: { color: colors.textSubtle, fontFamily: font.sans, fontSize: 11, lineHeight: 16, marginTop: 3 } });
