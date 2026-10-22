import { ShieldCheck, ShieldAlert, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeProvider';
import { font, radius, spacing } from '@/theme';
import type { QualityTone } from '@/types/market';

export function QualityBadge({ label, tone }: { label: string; tone: QualityTone }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const config = {
    clean: { color: colors.green, background: colors.greenSoft, Icon: ShieldCheck },
    watch: { color: colors.amber, background: colors.amberSoft, Icon: ShieldAlert },
    caution: { color: colors.red, background: colors.redSoft, Icon: TriangleAlert },
  };
  const { color, background, Icon } = config[tone];
  return (
    <View accessible accessibilityLabel={`Market quality: ${label}`} style={[styles.badge, { backgroundColor: background }]}>
      <Icon aria-hidden color={color} size={14} strokeWidth={2} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  badge: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, minHeight: 28, paddingHorizontal: spacing.sm },
  label: { fontFamily: font.sansMedium, fontSize: 12 },
});
